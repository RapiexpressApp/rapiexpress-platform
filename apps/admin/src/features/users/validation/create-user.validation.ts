import { createUserPayloadSchema } from '@rapiexpress/api-client/users.schemas';
import * as z from 'zod';

export const createUserFormSchema = createUserPayloadSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export type CreateUserFormInput = z.input<typeof createUserFormSchema>;
export type CreateUserFormValues = z.output<typeof createUserFormSchema>;
