import { describe, expect, it } from 'vitest';

import { formatDate, formatUsd, formatWeightLb } from './format';

describe('formatUsd', () => {
  it('always shows two decimals with the Spanish decimal comma', () => {
    expect(formatUsd(59.9)).toBe('USD 59,90');
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

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('reads an instant just after midnight UTC as that UTC day', () => {
    expect(formatDate('2026-03-15T01:30:00.000Z')).toBe('15 mar 2026');
  });
});
