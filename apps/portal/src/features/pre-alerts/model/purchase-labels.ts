import type { Purchase, PurchaseStatus } from '@rapiexpress/api-client/purchases.schemas';

export type CustomsCategory = Purchase['suggestedCategory'];

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING_RECEPTION: 'Por recibir',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
};

export const PURCHASE_STATUS_FILTER_LABEL: Record<PurchaseStatus, string> = {
  PENDING_RECEPTION: 'Por recibir',
  RECEIVED: 'Recibidas',
  CANCELLED: 'Canceladas',
};

export const CATEGORY_LABEL: Record<CustomsCategory, string> = {
  FOUR_BY_FOUR: '4x4',
  MIGRANT: 'G (migrante)',
  COMMERCIAL: 'C (comercial)',
};

export const CATEGORY_RULE: Record<CustomsCategory, string> = {
  FOUR_BY_FOUR: 'Hasta USD 400 y 8,5 lb.',
  MIGRANT: 'Para uso personal.',
  COMMERCIAL: 'Hasta 100 kg y USD 5.000.',
};
