import * as z from 'zod';

import {
  amountSchema,
  customsCategorySchema,
  trackingNumberSchema,
  trimmedTextSchema,
} from './field-schemas.ts';
import { paginatedSchema } from './pagination.ts';

export const MAX_DECLARED_VALUE_USD = 100000;
export const MAX_ESTIMATED_WEIGHT_LB = 1000;

export const PURCHASE_STATUSES = ['PENDING_RECEPTION', 'RECEIVED', 'CANCELLED'] as const;

export const purchaseStatusSchema = z.enum(PURCHASE_STATUSES, {
  errorMap: () => ({ message: 'Selecciona un estado.' }),
});

export const createPurchasePayloadSchema = z.object({
  store: trimmedTextSchema(120, {
    required: 'Ingresa la tienda.',
    tooLong: 'La tienda no puede superar los 120 caracteres.',
  }),
  trackingNumber: trackingNumberSchema,
  description: trimmedTextSchema(500, {
    required: 'Ingresa la descripción.',
    tooLong: 'La descripción no puede superar los 500 caracteres.',
  }),
  declaredValueUsd: amountSchema(MAX_DECLARED_VALUE_USD, 'El valor declarado'),
  estimatedWeightLb: amountSchema(MAX_ESTIMATED_WEIGHT_LB, 'El peso estimado'),
  suggestedCategory: customsCategorySchema,
});

export const updatePurchaseFieldsSchema = createPurchasePayloadSchema.partial();

export const updatePurchasePayloadSchema = updatePurchaseFieldsSchema.refine(
  (fields) => Object.values(fields).some((value) => value !== undefined),
  { message: 'Modifica al menos un campo.' }
);

export const purchaseSchema = z.object({
  id: z.string(),
  store: z.string(),
  trackingNumber: z.string(),
  description: z.string(),
  declaredValueUsd: z.number(),
  estimatedWeightLb: z.number(),
  suggestedCategory: customsCategorySchema,
  status: purchaseStatusSchema,
  createdAt: z.string(),
  receivedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
});

export const purchaseListSchema = paginatedSchema(purchaseSchema);

export interface MyPurchaseListParams {
  page: number;
  pageSize: number;
  status?: PurchaseStatus;
}

export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;
export type CreatePurchasePayload = z.input<typeof createPurchasePayloadSchema>;
export type UpdatePurchasePayload = z.input<typeof updatePurchasePayloadSchema>;
export type Purchase = z.infer<typeof purchaseSchema>;
export type PurchaseList = z.infer<typeof purchaseListSchema>;
