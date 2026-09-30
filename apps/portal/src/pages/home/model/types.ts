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
