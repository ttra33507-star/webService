import axios from 'axios';

const DEFAULT_API_BASE = 'https://api-bakong.nbc.gov.kh/v1';

const normaliseBase = (value?: string | null) =>
  (value ?? DEFAULT_API_BASE).toString().trim().replace(/\/+$/, '') || DEFAULT_API_BASE;

const resolveAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN ?? process.env.ALLOWED_ORIGINS ?? '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const allowedOrigins = resolveAllowedOrigins();

const setCorsHeaders = (req: any, res: any) => {
  const requestOrigin = req.headers.origin;
  if (allowedOrigins.length > 0) {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    }
  } else if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
};

const parseBody = (req: any) => {
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return {};
};

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { md5 } = parseBody(req);
  const trimmed = typeof md5 === 'string' ? md5.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ message: 'md5 hash is required.' });
  }

  const token = (process.env.BAKONG_TOKEN ?? '').trim();
  if (!token) {
    return res.status(500).json({ message: 'Bakong token is not configured.' });
  }

  const apiBase = normaliseBase(process.env.BAKONG_API_BASE);
  const url = `${apiBase}/check_transaction_by_md5`;

  try {
    const response = await axios.post(
      url,
      { md5: trimmed },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'khqr-vercel-service/1.0',
        },
        timeout: Number.parseInt(process.env.BAKONG_TIMEOUT ?? '30000', 10),
      },
    );

    const payload = response.data ?? {};
    const responseCode =
      typeof payload.responseCode === 'number' ? payload.responseCode : response.status;
    const errorCode =
      typeof payload.errorCode === 'number' ? payload.errorCode : payload.errorCode ?? null;
    const data =
      payload && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : null;
    const statusField = typeof data?.status === 'string' ? data.status.toUpperCase() : undefined;

    const status =
      responseCode === 0 || statusField === 'SUCCESS' || statusField === 'PAID' ? 'PAID' : 'UNPAID';

    return res.status(200).json({
      status,
      responseCode,
      errorCode,
      data,
      raw: payload,
      checkedAt: Date.now(),
    });
  } catch (error) {
    const isAxiosError = axios.isAxiosError(error);
    const statusCode = (isAxiosError && error.response?.status) || 502;
    const payload =
      (isAxiosError && error.response?.data && typeof error.response.data === 'object'
        ? error.response.data
        : null) ?? null;

    console.error('[bakong-status] failed request:', error);

    return res.status(statusCode).json({
      status: 'UNPAID',
      responseCode:
        (payload && typeof payload.responseCode === 'number' ? payload.responseCode : -1),
      errorCode: payload && typeof payload.errorCode === 'number' ? payload.errorCode : null,
      data:
        payload && payload.data && typeof payload.data === 'object'
          ? (payload.data as Record<string, unknown>)
          : null,
      raw: payload ?? { error: error instanceof Error ? error.message : 'Unknown error' },
      checkedAt: Date.now(),
      message: 'Unable to check Bakong payment status. Please try again later.',
    });
  }
}
