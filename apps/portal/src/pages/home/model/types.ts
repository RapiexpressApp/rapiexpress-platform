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
