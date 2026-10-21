import { resolveIncidentPayloadSchema } from '@rapiexpress/api-client/packages.schemas';
import * as z from 'zod';

import { optionalText } from '@/shared/lib/optional-text';

export const resolveIncidentFormSchema = z.object({
  resolutionNote: optionalText(resolveIncidentPayloadSchema.shape.resolutionNote),
});

export type ResolveIncidentFormInput = z.input<typeof resolveIncidentFormSchema>;
export type ResolveIncidentFormValues = z.output<typeof resolveIncidentFormSchema>;
