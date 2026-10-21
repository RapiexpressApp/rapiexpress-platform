import * as z from 'zod';

import { customerSummarySchema } from './customers.schemas.ts';
import {
  amountSchema,
  customsCategorySchema,
  trackingNumberSchema,
  trimmedTextSchema,
  uuidSchema,
} from './field-schemas.ts';
import { paginatedSchema } from './pagination.ts';
import { MAX_DECLARED_VALUE_USD } from './purchases.schemas.ts';

export const MAX_PACKAGE_WEIGHT_LB = 1000;

export const PACKAGE_STATUSES = [
  'IN_WAREHOUSE',
  'CONSOLIDATED',
  'IN_BAG',
  'SHIPPED',
  'IN_CUSTOMS',
  'AT_AGENCY',
  'READY_FOR_PICKUP',
  'DELIVERED',
] as const;

export const PACKAGE_TYPES = ['NORMAL', 'FRAGILE'] as const;

export const INCIDENT_TYPES = ['DAMAGED', 'CUSTOMS_HOLD', 'LOST', 'ABANDONED', 'OTHER'] as const;

export const PACKAGE_EVENT_SOURCES = ['RECEPTION', 'MANUAL'] as const;

export const packageStatusSchema = z.enum(PACKAGE_STATUSES, {
  errorMap: () => ({ message: 'Selecciona un estado.' }),
});

export const packageTypeSchema = z.enum(PACKAGE_TYPES, {
  errorMap: () => ({ message: 'Selecciona un tipo de paquete.' }),
});

export const incidentTypeSchema = z.enum(INCIDENT_TYPES, {
  errorMap: () => ({ message: 'Selecciona un tipo de incidencia.' }),
});

const weightSchema = amountSchema(MAX_PACKAGE_WEIGHT_LB, 'El peso');
const declaredValueSchema = amountSchema(MAX_DECLARED_VALUE_USD, 'El valor declarado');

const descriptionSchema = trimmedTextSchema(500, {
  required: 'Ingresa la descripción.',
  tooLong: 'La descripción no puede superar los 500 caracteres.',
});

const notesSchema = trimmedTextSchema(1000, {
  required: 'Ingresa la nota.',
  tooLong: 'Las notas no pueden superar los 1000 caracteres.',
});

export const receivePackagePayloadSchema = z.object({
  trackingNumber: trackingNumberSchema,
  purchaseId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  weightLb: weightSchema,
  packageType: packageTypeSchema.optional(),
  category: customsCategorySchema.optional(),
  declaredValueUsd: declaredValueSchema.optional(),
  description: descriptionSchema.optional(),
  notes: notesSchema.optional(),
  confirmDuplicate: z.boolean().optional(),
});

export const updatePackageFieldsSchema = z.object({
  weightLb: weightSchema.optional(),
  packageType: packageTypeSchema.optional(),
  category: customsCategorySchema.optional(),
  declaredValueUsd: declaredValueSchema.optional(),
  description: descriptionSchema.optional(),
  notes: notesSchema.optional(),
});

export const updatePackagePayloadSchema = updatePackageFieldsSchema.refine(
  (fields) => Object.values(fields).some((value) => value !== undefined),
  { message: 'Modifica al menos un campo.' }
);

export const transitionPackagePayloadSchema = z.object({ to: packageStatusSchema });

export const openIncidentPayloadSchema = z.object({
  type: incidentTypeSchema,
  reason: trimmedTextSchema(500, {
    required: 'Describe la incidencia.',
    tooLong: 'El motivo no puede superar los 500 caracteres.',
  }),
});

export const resolveIncidentPayloadSchema = z.object({
  resolutionNote: trimmedTextSchema(500, {
    required: 'Ingresa la nota de resolución.',
    tooLong: 'La nota no puede superar los 500 caracteres.',
  }).optional(),
});

export const assignCustomerPayloadSchema = z.object({ customerId: uuidSchema });

export const linkPurchasePayloadSchema = z.object({ purchaseId: uuidSchema });

export const existingPackageSchema = z.object({
  id: z.string(),
  warehouseNumber: z.string(),
  status: packageStatusSchema,
  customerId: z.string().nullable(),
  createdAt: z.string(),
});

export const receptionMatchSchema = z.object({
  purchaseId: z.string(),
  customer: customerSummarySchema.nullable(),
  store: z.string(),
  trackingNumber: z.string(),
  description: z.string(),
  declaredValueUsd: z.number(),
  estimatedWeightLb: z.number(),
  suggestedCategory: customsCategorySchema,
  createdAt: z.string(),
});

export const receptionLookupSchema = z.object({
  trackingNumber: z.string(),
  existingPackages: z.array(existingPackageSchema),
  matches: z.array(receptionMatchSchema),
});

export const packageLabelSchema = z.object({
  warehouseNumber: z.string(),
  customerName: z.string().nullable(),
  lockerCode: z.string().nullable(),
});

export const packageDetailSchema = z.object({
  id: z.string(),
  warehouseNumber: z.string(),
  trackingNumber: z.string(),
  status: packageStatusSchema,
  customer: customerSummarySchema.nullable(),
  purchaseId: z.string().nullable(),
  weightLb: z.number(),
  weightKg: z.number(),
  packageType: packageTypeSchema,
  category: customsCategorySchema.nullable(),
  declaredValueUsd: z.number().nullable(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  duplicateConfirmed: z.boolean(),
  createdAt: z.string(),
  label: packageLabelSchema,
});

export const packageListItemSchema = z.object({
  id: z.string(),
  warehouseNumber: z.string(),
  trackingNumber: z.string(),
  status: packageStatusSchema,
  customer: customerSummarySchema.nullable(),
  weightLb: z.number(),
  weightKg: z.number(),
  category: customsCategorySchema.nullable(),
  declaredValueUsd: z.number().nullable(),
  hasOpenIncident: z.boolean(),
  createdAt: z.string(),
});

export const packageListSchema = paginatedSchema(packageListItemSchema);

export const staffUserSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  lastName: z.string(),
});

export const packageIncidentSchema = z.object({
  id: z.string(),
  packageId: z.string(),
  type: incidentTypeSchema,
  reason: z.string(),
  openedBy: staffUserSummarySchema,
  openedAt: z.string(),
  resolvedBy: staffUserSummarySchema.nullable(),
  resolvedAt: z.string().nullable(),
  resolutionNote: z.string().nullable(),
});

export const packageEventSchema = z.object({
  fromStatus: packageStatusSchema.nullable(),
  toStatus: packageStatusSchema,
  source: z.enum(PACKAGE_EVENT_SOURCES),
  actor: staffUserSummarySchema,
  occurredAt: z.string(),
});

export const packagePurchaseSchema = z.object({
  id: z.string(),
  store: z.string(),
  trackingNumber: z.string(),
  declaredValueUsd: z.number(),
  estimatedWeightLb: z.number(),
  suggestedCategory: customsCategorySchema,
  createdAt: z.string(),
});

export const packageStaffDetailSchema = packageDetailSchema.extend({
  purchase: packagePurchaseSchema.nullable(),
  events: z.array(packageEventSchema),
  allowedTransitions: z.array(packageStatusSchema),
  openIncident: packageIncidentSchema.nullable(),
  incidents: z.array(packageIncidentSchema),
});

export interface PackageListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: PackageStatus;
  unassigned?: boolean;
  hasIncident?: boolean;
}

export type PackageStatus = z.infer<typeof packageStatusSchema>;
export type PackageType = z.infer<typeof packageTypeSchema>;
export type IncidentType = z.infer<typeof incidentTypeSchema>;
export type ReceivePackagePayload = z.input<typeof receivePackagePayloadSchema>;
export type UpdatePackagePayload = z.input<typeof updatePackagePayloadSchema>;
export type OpenIncidentPayload = z.input<typeof openIncidentPayloadSchema>;
export type ResolveIncidentPayload = z.input<typeof resolveIncidentPayloadSchema>;
export type ExistingPackage = z.infer<typeof existingPackageSchema>;
export type ReceptionMatch = z.infer<typeof receptionMatchSchema>;
export type ReceptionLookup = z.infer<typeof receptionLookupSchema>;
export type PackageLabel = z.infer<typeof packageLabelSchema>;
export type PackageDetail = z.infer<typeof packageDetailSchema>;
export type PackageListItem = z.infer<typeof packageListItemSchema>;
export type PackageList = z.infer<typeof packageListSchema>;
export type StaffUserSummary = z.infer<typeof staffUserSummarySchema>;
export type PackageIncident = z.infer<typeof packageIncidentSchema>;
export type PackageEvent = z.infer<typeof packageEventSchema>;
export type PackagePurchase = z.infer<typeof packagePurchaseSchema>;
export type PackageStaffDetail = z.infer<typeof packageStaffDetailSchema>;
