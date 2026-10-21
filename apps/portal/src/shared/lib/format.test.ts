import { describe, expect, it } from 'vitest';

import { formatDate, formatUsd, formatWeightLb } from './format';

describe('formatUsd', () => {
  it('always shows two decimals with the Spanish decimal comma', () => {
    expect(formatUsd(120.5)).toBe('USD 120,50');
    expect(formatUsd(400)).toBe('USD 400,00');
  });

  it('groups thousands with a dot from five digits', () => {
    expect(formatUsd(12345.6)).toBe('USD 12.345,60');
  });
});

describe('formatWeightLb', () => {
  it('drops trailing zeros and keeps up to two decimals', () => {
    expect(formatWeightLb(8)).toBe('8 lb');
    expect(formatWeightLb(8.5)).toBe('8,5 lb');
    expect(formatWeightLb(8.25)).toBe('8,25 lb');
  });
});

describe('formatDate', () => {
  it('formats an ISO date in Spanish', () => {
    expect(formatDate('2026-03-15T12:00:00.000Z')).toBe('15 mar 2026');
  });

  it('reads the date in the pinned test timezone, not the machine one', () => {
    expect(formatDate('2026-03-15T01:00:00.000Z')).toBe('15 mar 2026');
    expect(formatDate('2026-03-15T23:30:00.000Z')).toBe('15 mar 2026');
    expect(new Date('2026-03-15T12:00:00.000Z').getTimezoneOffset()).toBe(0);
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});
