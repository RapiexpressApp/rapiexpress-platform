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

export type StepState = 'done' | 'current' | 'pending';

export interface TimelineStep {
  label: string;
  state: StepState;
  date?: string;
}

export interface FeaturedShipmentConfig {
  shipmentId: string;
  etaLabel: string;
  steps: TimelineStep[];
}

export interface FeaturedShipmentView {
  shipment: Shipment;
  etaLabel: string;
  steps: TimelineStep[];
}

export interface PreAlert {
  id: string;
  store: string;
  description: string;
}

export interface Locker {
  recipient: string;
  suite: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface HomeStats {
  inTransit: number;
  readyForPickup: number;
  preAlerts: number;
}
