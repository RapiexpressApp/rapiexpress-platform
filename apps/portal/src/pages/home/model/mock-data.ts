import type { Locker, PreAlert, Shipment } from './types';

export const CUSTOMER_FIRST_NAME = 'Carlos';

export const LOCKER: Locker = {
  recipient: 'Carlos Mendoza',
  suite: 'RX-85421',
  street: '8250 NW 27th St',
  city: 'Doral',
  state: 'FL',
  zip: '33122',
  country: 'Estados Unidos',
  phone: '+1 (305) 555-0142',
};

export const SHIPMENTS: Shipment[] = [
  {
    id: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    store: 'Amazon US',
    tracking: 'RX-772918342',
    status: 'in_transit',
    weightKg: 0.4,
    arrival: 'Jue 2 oct',
  },
  {
    id: 'nike-air-pegasus',
    name: 'Zapatillas Nike Air Pegasus',
    store: 'Nike US',
    tracking: 'RX-664019231',
    status: 'ready',
    weightKg: 0.9,
    arrival: 'Listo en agencia',
  },
  {
    id: 'kindle-paperwhite',
    name: 'Kindle Paperwhite 16 GB',
    store: 'Amazon US',
    tracking: 'RX-449102837',
    status: 'customs',
    weightKg: 0.3,
    arrival: 'Vie 3 oct',
  },
  {
    id: 'anker-usb-c-65w',
    name: 'Cargador Anker USB-C 65 W',
    store: 'Anker',
    tracking: 'RX-220918349',
    status: 'in_transit',
    weightKg: 0.3,
    arrival: 'Lun 6 oct',
  },
  {
    id: 'laptop-sleeve-15',
    name: 'Funda para laptop 15"',
    store: 'Etsy',
    tracking: 'RX-118273645',
    status: 'warehouse',
    weightKg: 0.5,
    arrival: 'En bodega Miami',
  },
];

export const PRE_ALERTS: PreAlert[] = [
  { id: 'amazon-keyboard', store: 'Amazon', description: 'Teclado mecánico' },
  { id: 'ebay-camera', store: 'eBay', description: 'Cámara instantánea' },
];
