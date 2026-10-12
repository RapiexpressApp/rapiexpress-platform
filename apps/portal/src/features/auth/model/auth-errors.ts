import { isAxiosError } from 'axios';

export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos.';
export const LOGIN_RETRY_MESSAGE = 'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.';

export function getLoginErrorMessage(error: unknown): string {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === 400 || status === 401 ? INVALID_CREDENTIALS_MESSAGE : LOGIN_RETRY_MESSAGE;
}
