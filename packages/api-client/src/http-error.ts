import { isAxiosError } from 'axios';

export function getHttpStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const body: unknown = error.response?.data;
  if (typeof body !== 'object' || body === null || !('code' in body)) return undefined;
  return typeof body.code === 'string' ? body.code : undefined;
}

export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && error.response === undefined;
}
