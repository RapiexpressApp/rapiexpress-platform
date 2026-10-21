import type { VisiblePackageStatus } from '@rapiexpress/api-client/tracking.schemas';

export const PACKAGE_STATUS_LABEL: Record<VisiblePackageStatus, string> = {
  WAREHOUSE: 'Bodega',
  SHIPPED: 'Embarcado',
  CUSTOMS: 'Aduana',
  AGENCY: 'Agencia',
  DELIVERED: 'Entregado',
};

export const READY_FOR_PICKUP_LABEL = 'Listo para retirar';
