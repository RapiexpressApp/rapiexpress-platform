import { createPurchasePayloadSchema } from '@rapiexpress/api-client/purchases.schemas';
import * as z from 'zod';

const DECIMAL_PATTERN = /^\d*[.,]?\d+$/;

function parseFormNumber(raw: string): number | undefined {
  const text = raw.trim();
  if (text === '') return undefined;
  return DECIMAL_PATTERN.test(text) ? Number(text.replace(',', '.')) : Number.NaN;
}

function formNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.string().transform(parseFormNumber).pipe(schema);
}

export const purchaseFormSchema = createPurchasePayloadSchema.extend({
  declaredValueUsd: formNumber(createPurchasePayloadSchema.shape.declaredValueUsd),
  estimatedWeightLb: formNumber(createPurchasePayloadSchema.shape.estimatedWeightLb),
});

export type PurchaseFormInput = z.input<typeof purchaseFormSchema>;
export type PurchaseFormValues = z.output<typeof purchaseFormSchema>;
