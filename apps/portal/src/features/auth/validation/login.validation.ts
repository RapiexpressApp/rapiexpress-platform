import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "El formato de correo no es válido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
})

export type LoginSchemaType = z.infer<typeof loginSchema>;
