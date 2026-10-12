import { registerPayloadSchema } from '@rapiexpress/api-client/auth.schemas';
import * as z from 'zod';

export const registerSchema = registerPayloadSchema
  .extend({
    confirmPassword: z.string().min(1, { message: 'Confirma tu contraseña.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterSchemaType = z.output<typeof registerSchema>;
