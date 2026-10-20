import { getApiErrorCode } from '@rapiexpress/api-client/http-error';

export const DUPLICATE_PURCHASE_MESSAGE = 'Ya tienes una pre-alerta con esta guía.';
export const CREATE_PURCHASE_FAILED_MESSAGE =
  'No pudimos crear la pre-alerta. Revisa los datos e inténtalo de nuevo.';
export const LOAD_PURCHASES_FAILED_MESSAGE = 'No pudimos cargar tus pre-alertas.';

export function isDuplicatePurchaseError(error: unknown): boolean {
  return getApiErrorCode(error) === 'DUPLICATE_PURCHASE';
}
