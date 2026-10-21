import { getHttpStatus } from '@rapiexpress/api-client/http-error';

export const LOAD_SHIPMENTS_FAILED_MESSAGE = 'No pudimos cargar tus envíos.';
export const LOAD_SHIPMENT_FAILED_MESSAGE = 'No pudimos cargar este envío.';

export function isPackageNotFound(error: unknown): boolean {
  return getHttpStatus(error) === 404;
}
