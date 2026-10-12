import { getHttpStatus } from '@rapiexpress/api-client/http-error';

export const EMAIL_TAKEN_MESSAGE = 'Este correo ya está registrado.';
export const CREATE_USER_FAILED_MESSAGE =
  'No pudimos crear el usuario. Revisa los datos e inténtalo de nuevo.';
export const LOAD_USERS_FAILED_MESSAGE = 'No pudimos cargar los usuarios.';

export function isEmailTakenError(error: unknown): boolean {
  return getHttpStatus(error) === 409;
}
