import axios from 'axios';

const resolveBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL ?? '').toString().trim();
  if (configured) {
    return configured;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }

  return '/api';
};

const httpClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default httpClient;
