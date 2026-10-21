import { describe, expect, it } from 'vitest';

import { staffPurchaseFixture } from '@/test/purchases-handlers';
import { customerSummaryFixture, OTHER_CUSTOMER_ID } from '@/test/reception-handlers';

import {
  MAX_PURCHASE_SEARCH_LENGTH,
  pendingPurchasesSearch,
  purchasesOfCustomer,
} from './pending-purchases';

describe('pendingPurchasesSearch', () => {
  it('searches what the operator typed, trimmed', () => {
    expect(pendingPurchasesSearch(customerSummaryFixture(), '  TBA123  ')).toBe('TBA123');
    expect(pendingPurchasesSearch(null, 'TBA123')).toBe('TBA123');
  });

  it('narrows to the locker of the package customer when nothing was typed', () => {
    expect(pendingPurchasesSearch(customerSummaryFixture({ lockerCode: 'MI-00001' }), '')).toBe(
      'MI-00001'
    );
    expect(pendingPurchasesSearch(customerSummaryFixture({ lockerCode: 'MI-00001' }), '   ')).toBe(
      'MI-00001'
    );
  });

  it('falls back to the customer name when there is no locker', () => {
    expect(pendingPurchasesSearch(customerSummaryFixture({ lockerCode: null }), '')).toBe('Jane');
  });

  it('does not search when there is neither a customer nor a typed term', () => {
    expect(pendingPurchasesSearch(null, '')).toBe('');
  });

  it('cuts the term at the length the server accepts', () => {
    const term = pendingPurchasesSearch(null, 'a'.repeat(MAX_PURCHASE_SEARCH_LENGTH + 20));

    expect(term).toHaveLength(MAX_PURCHASE_SEARCH_LENGTH);
  });
});

describe('purchasesOfCustomer', () => {
  const mine = staffPurchaseFixture({ id: 'mine' });
  const theirs = staffPurchaseFixture({
    id: 'theirs',
    customer: customerSummaryFixture({ id: OTHER_CUSTOMER_ID }),
  });

  it('keeps only the purchases of the package customer', () => {
    expect(purchasesOfCustomer([mine, theirs], customerSummaryFixture())).toEqual([mine]);
  });

  it('keeps every purchase when the package has no customer', () => {
    expect(purchasesOfCustomer([mine, theirs], null)).toEqual([mine, theirs]);
  });
});
