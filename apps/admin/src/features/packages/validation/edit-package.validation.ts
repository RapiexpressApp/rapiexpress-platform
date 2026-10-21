import { formNumberSchema } from '@rapiexpress/api-client/field-schemas';
import { updatePackageFieldsSchema } from '@rapiexpress/api-client/packages.schemas';
import * as z from 'zod';

import { optionalText } from '@/shared/lib/optional-text';

const { shape } = updatePackageFieldsSchema;

export const editPackageFormSchema = z.object({
  weightLb: formNumberSchema(shape.weightLb.unwrap()),
  packageType: shape.packageType.unwrap(),
  category: optionalText(shape.category),
  declaredValueUsd: formNumberSchema(shape.declaredValueUsd),
  description: optionalText(shape.description),
  notes: optionalText(shape.notes),
});

export type EditPackageFormInput = z.input<typeof editPackageFormSchema>;
export type EditPackageFormValues = z.output<typeof editPackageFormSchema>;
