import type { Purchase, UpdatePurchasePayload } from '@rapiexpress/api-client/purchases.schemas';

import type { PurchaseFormInput, PurchaseFormValues } from '../validation/purchase.validation';

function toDecimalComma(value: string): string {
  return value.replace('.', ',');
}

export function toFormValues(purchase: Purchase): PurchaseFormInput {
  return {
    store: purchase.store,
    trackingNumber: purchase.trackingNumber,
    description: purchase.description,
    declaredValueUsd: toDecimalComma(purchase.declaredValueUsd.toFixed(2)),
    estimatedWeightLb: toDecimalComma(String(purchase.estimatedWeightLb)),
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
