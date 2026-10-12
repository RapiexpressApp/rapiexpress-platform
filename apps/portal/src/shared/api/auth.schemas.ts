import * as z from 'zod';

export const loginPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'El formato de correo no es válido.' }),
  password: z.string().min(1, { message: 'Ingresa tu contraseña.' }),
});

export const registerPayloadSchema = z.object({
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
    .min(1, { message: 'Ingresa tu nombre.' })
    .max(100, { message: 'El nombre no puede superar los 100 caracteres.' }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: 'Ingresa tu apellido.' })
    .max(100, { message: 'El apellido no puede superar los 100 caracteres.' }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, {
      message: 'Ingresa un teléfono válido, por ejemplo +58 412 1234567.',
    }),
});

export const tokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string(),
  expiresIn: z.number(),
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  lastName: z.string(),
  phone: z.string(),
  kind: z.string(),
  role: z.string(),
  lockerCode: z.string(),
  createdAt: z.string(),
});

export type LoginPayload = z.input<typeof loginPayloadSchema>;
export type RegisterPayload = z.input<typeof registerPayloadSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
