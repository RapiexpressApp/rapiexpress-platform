import { describe, expect, it } from 'vitest';

import { parseScannedGuide } from './scan-guide';

describe('parseScannedGuide', () => {
  it('normalizes the guide the same way the backend does', () => {
    expect(parseScannedGuide(' 1z999-aa1 0123456784\r\n')).toEqual({
      ok: true,
      trackingNumber: '1Z999AA10123456784',
    });
  });

  it('accepts the 6 and 64 character bounds', () => {
    expect(parseScannedGuide('abc123').ok).toBe(true);
    expect(parseScannedGuide('A'.repeat(64)).ok).toBe(true);
  });

  it.each(['', '   ', '\r\n', ' - - '])('asks for the guide when the input is %j', (raw) => {
    expect(parseScannedGuide(raw)).toEqual({ ok: false, message: 'Ingresa la guía.' });
  });

  it.each(['AB-12', 'A'.repeat(65), 'TRACK#12345', 'STRAßE1234'])(
    'explains the allowed shape when the input is %j',
    (raw) => {
      expect(parseScannedGuide(raw)).toEqual({
        ok: false,
        message: 'La guía debe tener entre 6 y 64 letras o números.',
      });
    }
  );
});
