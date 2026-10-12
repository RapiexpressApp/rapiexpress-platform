import * as z from 'zod';

import { paginatedSchema } from './pagination.ts';

export const STAFF_ROLES = ['ADMIN', 'OPERATIONS', 'WAREHOUSE'] as const;

export const staffRoleSchema = z.enum(STAFF_ROLES, {
  errorMap: () => ({ message: 'Selecciona un rol.' }),
});

export const createUserPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'El formato de correo no es válido.' })
    .max(254, { message: 'El correo no puede superar los 254 caracteres.' }),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    .max(128, { message: 'La contraseña no puede superar los 128 caracteres.' }),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Ingresa el nombre.' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres.' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Ingresa el apellido.' })
    .max(100, { message: 'El apellido no puede superar los 100 caracteres.' }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, {
      message: 'Ingresa un teléfono válido, por ejemplo +58 412 1234567.',
    }),
  role: staffRoleSchema,
});

export const userListItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  lastName: z.string(),
  phone: z.string(),
  role: staffRoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const userListSchema = paginatedSchema(userListItemSchema);

export const createdUserSchema = userListItemSchema.extend({ kind: z.string().nullable() });

export type StaffRole = z.infer<typeof staffRoleSchema>;
export type CreateUserPayload = z.input<typeof createUserPayloadSchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserList = z.infer<typeof userListSchema>;
export type CreatedUser = z.infer<typeof createdUserSchema>;
