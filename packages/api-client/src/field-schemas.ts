import * as z from 'zod';

export const TRACKING_NUMBER_PATTERN = /^[A-Z0-9]{6,64}$/;

export const CUSTOMS_CATEGORIES = ['FOUR_BY_FOUR', 'MIGRANT', 'COMMERCIAL'] as const;

export const customsCategorySchema = z.enum(CUSTOMS_CATEGORIES, {
  errorMap: () => ({ message: 'Selecciona una categoría.' }),
});

export const uuidSchema = z.string().uuid({ message: 'El identificador no es válido.' });

// Only ASCII letters are uppercased: toUpperCase() would turn "ß" into "SS"
// and dotless "ı" into "I", making non-ASCII input look like a valid number.
export function normalizeTrackingNumber(raw: string): string {
  return raw.replace(/[\s-]+/g, '').replace(/[a-z]/g, (letter) => letter.toUpperCase());
}

export const trackingNumberSchema = z
  .string({ required_error: 'Ingresa la guía.', invalid_type_error: 'La guía no es válida.' })
  .transform(normalizeTrackingNumber)
  .pipe(
    z.string().regex(TRACKING_NUMBER_PATTERN, {
      message: 'La guía debe tener entre 6 y 64 letras o números.',
    })
  );

interface TextMessages {
  required: string;
  tooLong: string;
}

export function trimmedTextSchema(max: number, messages: TextMessages) {
  return z
    .string({ required_error: messages.required, invalid_type_error: messages.required })
    .trim()
    .min(1, { message: messages.required })
    .max(max, { message: messages.tooLong });
}

export function amountSchema(max: number, label: string) {
  return z
    .number({
      required_error: `${label} es obligatorio.`,
      invalid_type_error: `${label} debe ser un número.`,
    })
    .finite({ message: `${label} debe ser un número.` })
    .positive({ message: `${label} debe ser mayor que 0.` })
    .max(max, { message: `${label} no puede superar ${max}.` })
    .refine((value) => Number(value.toFixed(2)) === value, {
      message: `${label} admite como máximo 2 decimales.`,
    });
}
