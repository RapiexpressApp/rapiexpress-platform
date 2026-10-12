import { describe, expect, it } from 'vitest';

import { registerSchema } from './register.validation';

const valid = {
  name: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+58 412 1234567',
  password: 'secret-pass',
  confirmPassword: 'secret-pass',
};

function messagesFor(input: Record<string, unknown>, path: string): string[] {
  const result = registerSchema.safeParse({ ...valid, ...input });
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path[0] === path).map((i) => i.message);
}

describe('registerSchema', () => {
  it('accepts a valid payload and normalizes strings', () => {
    const result = registerSchema.parse({
      ...valid,
      name: '  Jane ',
      email: ' Jane@Example.com ',
    });

    expect(result.name).toBe('Jane');
    expect(result.email).toBe('jane@example.com');
  });

  it.each(['name', 'lastName'])('requires %s after trimming', (field) => {
    expect(messagesFor({ [field]: '   ' }, field)).toHaveLength(1);
  });

  it.each(['name', 'lastName'])('limits %s to 100 characters', (field) => {
    expect(messagesFor({ [field]: 'a'.repeat(100) }, field)).toHaveLength(0);
    expect(messagesFor({ [field]: 'a'.repeat(101) }, field)).toHaveLength(1);
  });

  it('rejects invalid emails', () => {
    expect(messagesFor({ email: 'not-an-email' }, 'email')).toEqual([
      'El formato de correo no es válido.',
    ]);
  });

  it('limits the email to 254 characters', () => {
    const local = 'a'.repeat(64);
    const tooLong = `${local}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`;
    expect(tooLong.length).toBeGreaterThan(254);
    expect(messagesFor({ email: tooLong }, 'email').length).toBeGreaterThan(0);
  });

  it.each(['+58 412 1234567', '04121234567', '(0412) 123-4567'])('accepts phone %s', (phone) => {
    expect(messagesFor({ phone }, 'phone')).toHaveLength(0);
  });

  it.each(['12345', 'abc1234567', '+58 412 1234567 ext 2', '1'.repeat(21)])(
    'rejects phone %s',
    (phone) => {
      expect(messagesFor({ phone }, 'phone')).toHaveLength(1);
    }
  );

  it('requires passwords between 8 and 128 characters', () => {
    expect(
      messagesFor({ password: 'a'.repeat(7), confirmPassword: 'a'.repeat(7) }, 'password')
    ).toEqual(['La contraseña debe tener al menos 8 caracteres.']);
    expect(
      messagesFor({ password: 'a'.repeat(128), confirmPassword: 'a'.repeat(128) }, 'password')
    ).toEqual([]);
    expect(
      messagesFor({ password: 'a'.repeat(129), confirmPassword: 'a'.repeat(129) }, 'password')
    ).toHaveLength(1);
  });

  it('requires the confirmation to match the password', () => {
    expect(messagesFor({ confirmPassword: 'different-pass' }, 'confirmPassword')).toEqual([
      'Las contraseñas no coinciden.',
    ]);
  });

  it('requires a confirmation value', () => {
    expect(messagesFor({ confirmPassword: '' }, 'confirmPassword').length).toBeGreaterThan(0);
  });
});
