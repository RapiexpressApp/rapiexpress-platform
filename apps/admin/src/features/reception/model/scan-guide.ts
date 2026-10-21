import {
  normalizeTrackingNumber,
  trackingNumberSchema,
} from '@rapiexpress/api-client/field-schemas';

export type ScannedGuide = { ok: true; trackingNumber: string } | { ok: false; message: string };

export function parseScannedGuide(raw: string): ScannedGuide {
  if (normalizeTrackingNumber(raw) === '') return { ok: false, message: 'Ingresa la guía.' };

  const result = trackingNumberSchema.safeParse(raw);
  return result.success
    ? { ok: true, trackingNumber: result.data }
    : { ok: false, message: result.error.issues[0]?.message ?? 'La guía no es válida.' };
}
