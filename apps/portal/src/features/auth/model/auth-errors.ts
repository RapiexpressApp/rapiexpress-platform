import { isAxiosError } from 'axios';

export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos.';
export const LOGIN_RETRY_MESSAGE = 'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.';
export const EMAIL_TAKEN_MESSAGE = 'Este correo ya está registrado.';
export const REGISTER_FAILED_MESSAGE =
  'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.';
export const ACCOUNT_CREATED_LOGIN_FAILED_MESSAGE =
  'Tu cuenta fue creada, pero no pudimos iniciar sesión. Inicia sesión desde la página de ingreso.';

export class AccountCreatedLoginFailedError extends Error {
  constructor(cause: unknown) {
    super('Account created but automatic login failed', { cause });
  }
}

function statusOf(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function getLoginErrorMessage(error: unknown): string {
  const status = statusOf(error);
  return status === 400 || status === 401 ? INVALID_CREDENTIALS_MESSAGE : LOGIN_RETRY_MESSAGE;
}

export function isEmailTakenError(error: unknown): boolean {
  return statusOf(error) === 409;
}

export function getRegisterErrorMessage(error: unknown): string {
  return error instanceof AccountCreatedLoginFailedError
    ? ACCOUNT_CREATED_LOGIN_FAILED_MESSAGE
    : REGISTER_FAILED_MESSAGE;
}
