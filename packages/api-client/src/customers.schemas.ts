import * as z from 'zod';

import { paginatedSchema } from './pagination.ts';

export const customerKindSchema = z.enum(['CUSTOMER', 'COURIER']);

export const customerListItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  lastName: z.string(),
  phone: z.string(),
  kind: customerKindSchema,
  lockerCode: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const customerListSchema = paginatedSchema(customerListItemSchema);

export type CustomerKind = z.infer<typeof customerKindSchema>;
export type CustomerListItem = z.infer<typeof customerListItemSchema>;
export type CustomerList = z.infer<typeof customerListSchema>;
