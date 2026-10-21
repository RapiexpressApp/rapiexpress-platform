import { formNumberSchema } from '@rapiexpress/api-client/field-schemas';
import { receivePackagePayloadSchema } from '@rapiexpress/api-client/packages.schemas';
import type * as z from 'zod';

import { optionalText } from '@/shared/lib/optional-text';

const { shape } = receivePackagePayloadSchema;

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
