import type { Purchase, UpdatePurchasePayload } from '@rapiexpress/api-client/purchases.schemas';

import type { PurchaseFormInput, PurchaseFormValues } from '../validation/purchase.validation';

export function toFormValues(purchase: Purchase): PurchaseFormInput {
  return {
    store: purchase.store,
    trackingNumber: purchase.trackingNumber,
    description: purchase.description,
    declaredValueUsd: String(purchase.declaredValueUsd),
    estimatedWeightLb: String(purchase.estimatedWeightLb),
    suggestedCategory: purchase.suggestedCategory,
  };
}

export function getPurchaseChanges(
  purchase: Purchase,
  values: PurchaseFormValues
): UpdatePurchasePayload {
  return {
    ...(values.store !== purchase.store && { store: values.store }),
    ...(values.trackingNumber !== purchase.trackingNumber && {
      trackingNumber: values.trackingNumber,
    }),
    ...(values.description !== purchase.description && { description: values.description }),
    ...(values.declaredValueUsd !== purchase.declaredValueUsd && {
      declaredValueUsd: values.declaredValueUsd,
    }),
    ...(values.estimatedWeightLb !== purchase.estimatedWeightLb && {
      estimatedWeightLb: values.estimatedWeightLb,
    }),
    ...(values.suggestedCategory !== purchase.suggestedCategory && {
      suggestedCategory: values.suggestedCategory,
    }),
  };
}
