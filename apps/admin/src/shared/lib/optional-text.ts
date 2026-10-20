import * as z from 'zod';

export function optionalText<T extends z.ZodTypeAny>(schema: T) {
  return z
    .string()
    .transform((raw) => (raw.trim() === '' ? undefined : raw))
    .pipe(schema);
}
