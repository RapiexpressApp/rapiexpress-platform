import { formNumberSchema } from '@rapiexpress/api-client/field-schemas';
import { receivePackagePayloadSchema } from '@rapiexpress/api-client/packages.schemas';
import * as z from 'zod';

const { shape } = receivePackagePayloadSchema;

function optionalText<T extends z.ZodTypeAny>(schema: T) {
  return z
    .string()
    .transform((raw) => (raw.trim() === '' ? undefined : raw))
    .pipe(schema);
}

export const receptionFormSchema = receivePackagePayloadSchema
  .omit({ trackingNumber: true, purchaseId: true, customerId: true, confirmDuplicate: true })
  .extend({
    weightLb: formNumberSchema(shape.weightLb),
    packageType: optionalText(shape.packageType),
    category: optionalText(shape.category),
    declaredValueUsd: formNumberSchema(shape.declaredValueUsd),
    description: optionalText(shape.description),
    notes: optionalText(shape.notes),
  });

export type ReceptionFormInput = z.input<typeof receptionFormSchema>;
export type ReceptionFormValues = z.output<typeof receptionFormSchema>;
