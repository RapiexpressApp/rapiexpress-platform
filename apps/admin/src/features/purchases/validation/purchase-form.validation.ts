import { customsCategorySchema, formNumberSchema } from '@rapiexpress/api-client/field-schemas';
import { createPurchaseForCustomerPayloadSchema } from '@rapiexpress/api-client/purchases.schemas';
import * as z from 'zod';

const { shape } = createPurchaseForCustomerPayloadSchema;

export const purchaseFormSchema = createPurchaseForCustomerPayloadSchema.extend({
  declaredValueUsd: formNumberSchema(shape.declaredValueUsd),
  estimatedWeightLb: formNumberSchema(shape.estimatedWeightLb),
  suggestedCategory: z.string().pipe(customsCategorySchema),
});

export type PurchaseFormInput = z.input<typeof purchaseFormSchema>;
export type PurchaseFormValues = z.output<typeof purchaseFormSchema>;
