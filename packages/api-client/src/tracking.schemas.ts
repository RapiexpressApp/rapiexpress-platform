import * as z from 'zod';

import { customsCategorySchema } from './field-schemas.ts';
import { paginatedSchema } from './pagination.ts';

export const VISIBLE_PACKAGE_STATUSES = [
  'WAREHOUSE',
  'SHIPPED',
  'CUSTOMS',
  'AGENCY',
  'DELIVERED',
] as const;

export const visiblePackageStatusSchema = z.enum(VISIBLE_PACKAGE_STATUSES);

export const myPackageSchema = z.object({
  id: z.string(),
  warehouseNumber: z.string(),
  trackingNumber: z.string(),
  status: visiblePackageStatusSchema,
  readyForPickup: z.boolean(),
  weightLb: z.number(),
  weightKg: z.number(),
  category: customsCategorySchema.nullable(),
  declaredValueUsd: z.number().nullable(),
  description: z.string().nullable(),
  receivedAt: z.string(),
});

export const timelineStepSchema = z.object({
  status: visiblePackageStatusSchema,
  reachedAt: z.string(),
});

export const myPackageDetailSchema = myPackageSchema.extend({
  timeline: z.array(timelineStepSchema),
});

export const myPackageListSchema = paginatedSchema(myPackageSchema);

export interface MyPackageListParams {
  page: number;
  pageSize: number;
  status?: VisiblePackageStatus;
}

export type VisiblePackageStatus = z.infer<typeof visiblePackageStatusSchema>;
export type MyPackage = z.infer<typeof myPackageSchema>;
export type TimelineStep = z.infer<typeof timelineStepSchema>;
export type MyPackageDetail = z.infer<typeof myPackageDetailSchema>;
export type MyPackageList = z.infer<typeof myPackageListSchema>;
