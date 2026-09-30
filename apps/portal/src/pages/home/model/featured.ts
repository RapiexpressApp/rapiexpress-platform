import type { FeaturedShipmentConfig, FeaturedShipmentView, Shipment } from './types';

export function resolveFeaturedShipment(
  shipments: Shipment[],
  config: FeaturedShipmentConfig
): FeaturedShipmentView | undefined {
  const shipment = shipments.find((s) => s.id === config.shipmentId);
  if (!shipment) return undefined;
  return { shipment, etaLabel: config.etaLabel, steps: config.steps };
}
