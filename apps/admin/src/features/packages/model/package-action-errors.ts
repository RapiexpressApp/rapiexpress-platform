import { getApiErrorCode, isNetworkError } from '@rapiexpress/api-client/http-error';
import { getInvalidTransition } from '@rapiexpress/api-client/package-errors';

import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

import type { PackageNoticeContent } from './package-notice';

export type ActionFailure =
  { kind: 'stale'; notice: PackageNoticeContent } | { kind: 'inline'; message: string };

type Rule = ActionFailure | ((error: unknown) => ActionFailure);

const stale = (message: string, showIncidents?: boolean): ActionFailure => ({
  kind: 'stale',
  notice: { message, ...(showIncidents && { showIncidents }) },
});

const inline = (message: string): ActionFailure => ({ kind: 'inline', message });

const PACKAGE_GONE = stale('Este paquete ya no existe.');

function classify(error: unknown, rules: Record<string, Rule>, failedTo: string): ActionFailure {
  const code = getApiErrorCode(error);
  const rule = code !== undefined && Object.hasOwn(rules, code) ? rules[code] : undefined;
  if (rule) return typeof rule === 'function' ? rule(error) : rule;
  if (code === 'PACKAGE_NOT_FOUND') return PACKAGE_GONE;
  return inline(
    isNetworkError(error)
      ? `No pudimos ${failedTo}. Revisa tu conexión e inténtalo de nuevo.`
      : `No pudimos ${failedTo}. Inténtalo de nuevo.`
  );
}

function quoted(statuses: readonly (keyof typeof PACKAGE_STATUS_LABEL)[]): string {
  return statuses.map((status) => `«${PACKAGE_STATUS_LABEL[status]}»`).join(', ');
}

function describeInvalidTransition(error: unknown): ActionFailure {
  const transition = getInvalidTransition(error);
  if (!transition) {
    return stale('Ese cambio de estado no está permitido. Actualizamos la información.');
  }
  const move = `No se puede mover el paquete de ${quoted([transition.from])} a ${quoted([transition.to])}.`;
  return stale(
    transition.allowed.length > 0
      ? `${move} Movimientos permitidos: ${quoted(transition.allowed)}.`
      : `${move} Desde ${quoted([transition.from])} no hay movimientos permitidos.`
  );
}

export function classifyUpdateError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      PACKAGE_NOT_EDITABLE: stale(
        'Este paquete ya salió de la bodega y sus datos ya no se pueden editar. Actualizamos la información.'
      ),
    },
    'guardar los cambios'
  );
}

export function classifyTransitionError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      INVALID_TRANSITION: describeInvalidTransition,
      PACKAGE_STATUS_CHANGED: stale(
        'El estado del paquete cambió mientras lo revisabas. Actualizamos la información para que elijas de nuevo.'
      ),
      PACKAGE_HAS_OPEN_INCIDENT: stale(
        'El paquete tiene una incidencia abierta. Resuélvela antes de cambiar su estado.',
        true
      ),
    },
    'cambiar el estado del paquete'
  );
}

export function classifyAssignError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      PACKAGE_ALREADY_ASSIGNED: stale(
        'Este paquete ya tiene un cliente asignado. Actualizamos la información.'
      ),
      CUSTOMER_NOT_FOUND: inline('El cliente ya no está activo. Elige otro cliente.'),
    },
    'asignar el cliente'
  );
}

export function classifyLinkError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      PACKAGE_ALREADY_LINKED: stale(
        'Este paquete ya está vinculado a una compra. Actualizamos la información.'
      ),
      PURCHASE_NOT_PENDING: inline('Esa pre-alerta ya fue recibida o cancelada. Elige otra.'),
      PURCHASE_NOT_FOUND: inline('Esa pre-alerta ya no existe. Elige otra.'),
      CUSTOMER_PURCHASE_MISMATCH: inline(
        'Esa pre-alerta pertenece a otro cliente distinto al del paquete. Elige otra.'
      ),
    },
    'vincular la compra'
  );
}

export function classifyOpenIncidentError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      INCIDENT_ALREADY_OPEN: stale(
        'Este paquete ya tiene una incidencia abierta. Resuélvela antes de abrir otra.',
        true
      ),
    },
    'abrir la incidencia'
  );
}

export function classifyResolveError(error: unknown): ActionFailure {
  return classify(
    error,
    {
      INCIDENT_ALREADY_RESOLVED: stale(
        'Esta incidencia ya fue resuelta. Actualizamos la información.'
      ),
      INCIDENT_NOT_FOUND: stale('No encontramos esta incidencia. Actualizamos la información.'),
    },
    'resolver la incidencia'
  );
}
