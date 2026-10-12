import { getHttpStatus } from '@rapiexpress/api-client/http-error';

export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos.';
export const LOGIN_RETRY_MESSAGE = 'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.';
export const NO_PANEL_ACCESS_MESSAGE = 'Tu cuenta no tiene acceso al panel.';

export class NoPanelAccessError extends Error {
  constructor() {
    super('Account role is not allowed in the admin panel');
  }
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof NoPanelAccessError) return NO_PANEL_ACCESS_MESSAGE;
  const status = getHttpStatus(error);
  return status === 400 || status === 401 ? INVALID_CREDENTIALS_MESSAGE : LOGIN_RETRY_MESSAGE;
}
