import type { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';
import type {
  IncidentType,
  PackageEvent,
  PackageStatus,
  PackageType,
} from '@rapiexpress/api-client/packages.schemas';

export type CustomsCategory = (typeof CUSTOMS_CATEGORIES)[number];

export const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  IN_WAREHOUSE: 'En bodega',
  CONSOLIDATED: 'Consolidado',
  IN_BAG: 'En saco',
  SHIPPED: 'Embarcado',
  IN_CUSTOMS: 'En aduana',
  AT_AGENCY: 'En agencia',
  READY_FOR_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
};

export const PACKAGE_TYPE_LABEL: Record<PackageType, string> = {
  NORMAL: 'Normal',
  FRAGILE: 'Frágil',
};

export const CATEGORY_LABEL: Record<CustomsCategory, string> = {
  FOUR_BY_FOUR: '4x4',
  MIGRANT: 'G (migrante)',
  COMMERCIAL: 'C (comercial)',
};

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  DAMAGED: 'Dañado',
  CUSTOMS_HOLD: 'Retenido en aduana',
  LOST: 'Extraviado',
  ABANDONED: 'Abandonado',
  OTHER: 'Otro',
};

export const EVENT_SOURCE_LABEL: Record<PackageEvent['source'], string> = {
  RECEPTION: 'Recepción',
  MANUAL: 'Manual',
};
