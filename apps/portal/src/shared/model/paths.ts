export const PRE_ALERTS_PATH = '/pre-alerts';
export const NEW_PRE_ALERT_PATH = '/pre-alerts?new=1';
export const SHIPMENTS_PATH = '/shipments';

export function shipmentPath(id: string): string {
  return `${SHIPMENTS_PATH}/${encodeURIComponent(id)}`;
}
