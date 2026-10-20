import { formNumberSchema } from '@rapiexpress/api-client/field-schemas';
import { createPurchasePayloadSchema } from '@rapiexpress/api-client/purchases.schemas';
import type * as z from 'zod';

export const purchaseFormSchema = createPurchasePayloadSchema.extend({
  declaredValueUsd: formNumberSchema(createPurchasePayloadSchema.shape.declaredValueUsd),
  estimatedWeightLb: formNumberSchema(createPurchasePayloadSchema.shape.estimatedWeightLb),
});

export type PurchaseFormInput = z.input<typeof purchaseFormSchema>;
export type PurchaseFormValues = z.output<typeof purchaseFormSchema>;
