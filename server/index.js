import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
];

const resolveOrigins = () => {
  const raw = process.env.CORS_ORIGIN ?? process.env.ALLOWED_ORIGINS ?? '';
  const list = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return list.length > 0 ? list : DEFAULT_ALLOWED_ORIGINS;
};

app.use(
  cors({
    origin: resolveOrigins(),
  }),
);

app.use(express.json());

const PORT = Number.parseInt(process.env.PORT ?? process.env.API_PORT ?? '3000', 10);
const BAKONG_TOKEN = (process.env.BAKONG_TOKEN ?? process.env.VITE_BAKONG_TOKEN ?? '').trim();
const API_BASE = (
  process.env.BAKONG_API_BASE ??
  process.env.VITE_BAKONG_API_BASE ??
  'https://api-bakong.nbc.gov.kh/v1'
)
  .toString()
  .trim()
  .replace(/\/+$/, '');

if (!BAKONG_TOKEN) {
  console.warn('[bakong-server] Warning: BAKONG_TOKEN is not set. Requests will fail until configured.');
}

const normaliseStatus = (responseCode, statusField) => {
  if (responseCode === 0) {
    return 'PAID';
  }
  const upper = typeof statusField === 'string' ? statusField.toUpperCase() : '';
  return upper === 'SUCCESS' || upper === 'PAID' ? 'PAID' : 'UNPAID';
};

app.get('/health', (_, res) => {
  res.json({ status: 'ok', checkedAt: Date.now() });
});

app.post('/bakong/status', async (req, res) => {
  const md5 = typeof req.body?.md5 === 'string' ? req.body.md5.trim() : '';

  if (!md5) {
    return res.status(400).json({
      message: 'md5 hash is required.',
    });
  }

  if (!BAKONG_TOKEN) {
    return res.status(500).json({
      message: 'Bakong token is not configured on the server.',
    });
  }

  const url = `${API_BASE}/check_transaction_by_md5`;

  try {
    const response = await axios.post(
      url,
      { md5 },
      {
        headers: {
          Authorization: `Bearer ${BAKONG_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'khqr-webservice/1.0 (+https://github.com/ttra33507-star/webService)',
        },
        timeout: Number.parseInt(process.env.BAKONG_TIMEOUT ?? '30000', 10),
      },
    );

    const payload = response.data ?? {};
    const bakongResponseCode =
      typeof payload.responseCode === 'number' ? payload.responseCode : response.status;
    const bakongErrorCode =
      typeof payload.errorCode === 'number' ? payload.errorCode : payload.errorCode ?? null;
    const bakongData =
      (payload.data && typeof payload.data === 'object' ? payload.data : null) ?? null;
    const status = normaliseStatus(bakongResponseCode, bakongData?.status);

    return res.json({
      status,
      responseCode: bakongResponseCode,
      errorCode: bakongErrorCode,
      data: bakongData,
      raw: payload,
      checkedAt: Date.now(),
    });
  } catch (error) {
    const isAxiosError = axios.isAxiosError(error);
    const statusCode = (isAxiosError && error.response?.status) || 502;
    const fallbackPayload =
      (isAxiosError && error.response?.data && typeof error.response.data === 'object'
        ? error.response.data
        : null) ?? null;

    console.error('[bakong-server] Bakong status check failed:', error);

    return res.status(statusCode).json({
      status: 'UNPAID',
      responseCode:
        (fallbackPayload && typeof fallbackPayload.responseCode === 'number'
          ? fallbackPayload.responseCode
          : -1),
      errorCode:
        (fallbackPayload && typeof fallbackPayload.errorCode === 'number'
          ? fallbackPayload.errorCode
          : null),
      data:
        fallbackPayload && fallbackPayload.data && typeof fallbackPayload.data === 'object'
          ? fallbackPayload.data
          : null,
      raw: fallbackPayload ?? { message: error.message ?? 'Unknown error' },
      checkedAt: Date.now(),
      message: 'Unable to check Bakong payment status. Please try again later.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[bakong-server] listening on http://localhost:${PORT}`);
});

