import type { ReceivePackagePayload } from '@rapiexpress/api-client/packages.schemas';

import type { ReceptionFormValues } from '../validation/reception-form.validation';
import type { ReceptionTarget } from './reception-target';

interface BuildReceivePayloadParams {
  trackingNumber: string;
  target: ReceptionTarget;
  values: ReceptionFormValues;
  confirmDuplicate?: boolean;
}

export function buildReceivePayload({
  trackingNumber,
  target,
  values,
  confirmDuplicate,
}: BuildReceivePayloadParams): ReceivePackagePayload {
  const { weightLb, packageType, category, declaredValueUsd, description, notes } = values;

  return {
    trackingNumber,
    weightLb,
    ...(target.kind === 'purchase' && { purchaseId: target.match.purchaseId }),
    ...(target.kind === 'customer' && { customerId: target.customer.id }),
    ...(packageType !== undefined && { packageType }),
    ...(category !== undefined && { category }),
    ...(declaredValueUsd !== undefined && { declaredValueUsd }),
    ...(description !== undefined && { description }),
    ...(notes !== undefined && { notes }),
    ...(confirmDuplicate && { confirmDuplicate: true }),
  };
}
