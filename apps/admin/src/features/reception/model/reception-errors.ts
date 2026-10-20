import { getApiErrorCode } from '@rapiexpress/api-client/http-error';
import { getExistingPackages } from '@rapiexpress/api-client/package-errors';
import type { ExistingPackage } from '@rapiexpress/api-client/packages.schemas';

export const PURCHASE_UNAVAILABLE_MESSAGE =
  'La compra ya no está pendiente de recepción. Puede que otra persona la haya recibido o que el cliente la haya cancelado. Consultamos la guía de nuevo.';
export const CUSTOMER_INACTIVE_MESSAGE =
  'El cliente ya no está activo. Busca otro cliente o recibe el bulto sin cliente.';
export const CUSTOMER_MISMATCH_MESSAGE =
  'La compra pertenece a otro cliente. Consultamos la guía de nuevo para revisar los datos.';
export const DUPLICATE_UNREADABLE_MESSAGE =
  'Otra persona acaba de recibir esta guía. Consultamos la guía de nuevo.';
export const RECEIVE_FAILED_MESSAGE =
  'No pudimos registrar la recepción. Revisa tu conexión e inténtalo de nuevo.';

export type ReceptionFailure =
  | { kind: 'duplicate'; packages: ExistingPackage[] }
  | { kind: 'relookup'; message: string }
  | { kind: 'customer-inactive'; message: string }
  | { kind: 'generic'; message: string };

export function classifyReceiveError(error: unknown): ReceptionFailure {
  switch (getApiErrorCode(error)) {
    case 'DUPLICATE_TRACKING_NUMBER': {
      const packages = getExistingPackages(error);
      return packages
        ? { kind: 'duplicate', packages }
        : { kind: 'relookup', message: DUPLICATE_UNREADABLE_MESSAGE };
    }
    case 'PURCHASE_NOT_PENDING':
    case 'PURCHASE_NOT_FOUND':
      return { kind: 'relookup', message: PURCHASE_UNAVAILABLE_MESSAGE };
    case 'CUSTOMER_PURCHASE_MISMATCH':
      return { kind: 'relookup', message: CUSTOMER_MISMATCH_MESSAGE };
    case 'CUSTOMER_NOT_FOUND':
      return { kind: 'customer-inactive', message: CUSTOMER_INACTIVE_MESSAGE };
    default:
      return { kind: 'generic', message: RECEIVE_FAILED_MESSAGE };
  }
}
