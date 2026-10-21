import { getApiErrorCode, getHttpStatus, isNetworkError } from '@rapiexpress/api-client/http-error';

export const LOAD_PURCHASES_FAILED_MESSAGE = 'No pudimos cargar las pre-alertas.';
export const DUPLICATE_PURCHASE_MESSAGE =
  'Este cliente ya tiene una pre-alerta activa con esta guía.';
export const CUSTOMER_INACTIVE_MESSAGE = 'El cliente ya no está activo. Elige otro cliente.';
export const CREATE_REJECTED_MESSAGE =
  'El servidor rechazó algún dato. Revisa el formulario e inténtalo de nuevo.';
export const CREATE_FAILED_MESSAGE = 'No pudimos crear la pre-alerta. Inténtalo de nuevo.';
export const CREATE_OFFLINE_MESSAGE =
  'No pudimos crear la pre-alerta. Revisa tu conexión e inténtalo de nuevo.';

export type CreateFailure =
  | { kind: 'duplicate'; message: string }
  | { kind: 'customer-inactive'; message: string }
  | { kind: 'message'; message: string };

export function classifyCreateError(error: unknown): CreateFailure {
  const code = getApiErrorCode(error);
  if (code === 'DUPLICATE_PURCHASE')
    return { kind: 'duplicate', message: DUPLICATE_PURCHASE_MESSAGE };
  if (code === 'CUSTOMER_NOT_FOUND') {
    return { kind: 'customer-inactive', message: CUSTOMER_INACTIVE_MESSAGE };
  }
  if (getHttpStatus(error) === 400) return { kind: 'message', message: CREATE_REJECTED_MESSAGE };
  return {
    kind: 'message',
    message: isNetworkError(error) ? CREATE_OFFLINE_MESSAGE : CREATE_FAILED_MESSAGE,
  };
}
