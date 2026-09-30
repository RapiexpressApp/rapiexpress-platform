import type { ShipmentStatus } from './types';

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  warehouse: 'En bodega Miami',
  in_transit: 'En tránsito',
  customs: 'En aduana',
  ready: 'Listo para retirar',
};

export function formatWeight(weightKg: number) {
  return `${weightKg} kg`;
}
