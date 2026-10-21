import { getApiErrorCode } from '@rapiexpress/api-client/http-error';

export const DUPLICATE_PURCHASE_MESSAGE = 'Ya tienes una pre-alerta con esta guía.';
export const CREATE_PURCHASE_FAILED_MESSAGE =
  'No pudimos crear la pre-alerta. Revisa los datos e inténtalo de nuevo.';
export const UPDATE_PURCHASE_FAILED_MESSAGE =
  'No pudimos guardar los cambios. Revisa los datos e inténtalo de nuevo.';
export const CANCEL_PURCHASE_FAILED_MESSAGE =
  'No pudimos cancelar la pre-alerta. Inténtalo de nuevo.';
export const NO_CHANGES_MESSAGE = 'Modifica al menos un campo para guardar los cambios.';
export const PURCHASE_NOT_PENDING_MESSAGE =
  'Esta pre-alerta ya fue recibida o cancelada y no se puede modificar. Actualizamos tu lista.';
export const LOAD_PURCHASES_FAILED_MESSAGE = 'No pudimos cargar tus pre-alertas.';

export function isDuplicatePurchaseError(error: unknown): boolean {
  return getApiErrorCode(error) === 'DUPLICATE_PURCHASE';
}

export function isPurchaseNotPendingError(error: unknown): boolean {
  return getApiErrorCode(error) === 'PURCHASE_NOT_PENDING';
}
