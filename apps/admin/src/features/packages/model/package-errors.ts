import { getHttpStatus } from '@rapiexpress/api-client/http-error';

export const LOAD_PACKAGES_FAILED_MESSAGE = 'No pudimos cargar los paquetes.';
export const LOAD_PACKAGE_FAILED_MESSAGE = 'No pudimos cargar este paquete.';

export function isPackageNotFound(error: unknown): boolean {
  return getHttpStatus(error) === 404;
}
