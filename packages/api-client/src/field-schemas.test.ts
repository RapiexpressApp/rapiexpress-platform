import { describe, expect, it } from 'vitest';

import {
  amountSchema,
  normalizeTrackingNumber,
  trackingNumberSchema,
  trimmedTextSchema,
} from './field-schemas.ts';

describe('normalizeTrackingNumber', () => {
  it('uppercases letters and removes whitespace and hyphens', () => {
    expect(normalizeTrackingNumber(' 1z-999 aa1\r\n')).toBe('1Z999AA1');
    expect(normalizeTrackingNumber('tba\t3141-5926')).toBe('TBA31415926');
  });

  it('keeps other punctuation and non ASCII letters so validation rejects them', () => {
    expect(normalizeTrackingNumber('abc_123.45')).toBe('ABC_123.45');
    expect(normalizeTrackingNumber('straße123')).toBe('STRAßE123');
  });
});

describe('trackingNumberSchema', () => {
  it('normalizes the value before validating it', () => {
    expect(trackingNumberSchema.parse(' 1z999-aa1 0123 ')).toBe('1Z999AA10123');
  });

  it('accepts the 6 and 64 character bounds', () => {
    expect(trackingNumberSchema.safeParse('A'.repeat(6)).success).toBe(true);
    expect(trackingNumberSchema.safeParse('A'.repeat(64)).success).toBe(true);
  });

  it.each([
    ['too short', 'AB-12'],
    ['too long', 'A'.repeat(65)],
    ['symbols', 'TRACK#12345'],
    ['only separators', ' - - '],
    ['non ASCII letters', 'STRAßE1234'],
    ['a number', 123456],
  ])('rejects a value that is %s', (_label, value) => {
    expect(trackingNumberSchema.safeParse(value).success).toBe(false);
  });
});

describe('trimmedTextSchema', () => {
  const schema = trimmedTextSchema(5, { required: 'required', tooLong: 'too long' });

  it('trims the value and enforces the bounds after trimming', () => {
    expect(schema.parse('  abc  ')).toBe('abc');
    expect(schema.safeParse('   ').success).toBe(false);
    expect(schema.safeParse('abcdef').success).toBe(false);
    expect(schema.safeParse('  abcde  ').success).toBe(true);
  });

  it('uses the provided messages', () => {
    expect(schema.safeParse('').error?.issues[0]?.message).toBe('required');
    expect(schema.safeParse('abcdef').error?.issues[0]?.message).toBe('too long');
  });
});

describe('amountSchema', () => {
  const schema = amountSchema(1000, 'El peso');

  it.each([0.01, 1, 2.5, 999.99, 1000])('accepts %s', (value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['zero', 0],
    ['a negative number', -1],
    ['more than the maximum', 1000.01],
    ['more than 2 decimals', 1.005],
    ['an exponent below one cent', 1e-7],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a string', '2.5'],
  ])('rejects %s', (_label, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
