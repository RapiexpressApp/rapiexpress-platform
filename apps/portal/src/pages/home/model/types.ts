import type { TimelineStepView } from '@/features/shipments/model/shipment-timeline';

export type ShipmentStatus = 'warehouse' | 'in_transit' | 'customs' | 'ready';

export interface Shipment {
  id: string;
  name: string;
  store: string;
  tracking: string;
  status: ShipmentStatus;
  weightKg: number;
  arrival: string;
}

export interface FeaturedShipmentConfig {
  shipmentId: string;
  etaLabel: string;
  steps: TimelineStepView[];
}

export interface FeaturedShipmentView {
  shipment: Shipment;
  etaLabel: string;
  steps: TimelineStepView[];
}

export interface PreAlert {
  id: string;
  store: string;
  description: string;
}

export interface WarehouseAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface Locker extends WarehouseAddress {
  recipient: string;
  suite: string;
}
