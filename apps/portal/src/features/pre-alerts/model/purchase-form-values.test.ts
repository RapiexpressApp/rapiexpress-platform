import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';
import { describe, expect, it } from 'vitest';

import { purchaseFixture } from '@/test/purchases-handlers';

import { getPurchaseChanges, toFormValues } from './purchase-form-values';

const purchase: Purchase = purchaseFixture();

const unchanged = {
  store: purchase.store,
  trackingNumber: purchase.trackingNumber,
  description: purchase.description,
  declaredValueUsd: purchase.declaredValueUsd,
  estimatedWeightLb: purchase.estimatedWeightLb,
  suggestedCategory: purchase.suggestedCategory,
};

describe('toFormValues', () => {
  it('turns the amounts into the strings the inputs show', () => {
    expect(toFormValues(purchase)).toEqual({
      store: 'Amazon',
      trackingNumber: 'TBA123456789',
      description: 'Audífonos inalámbricos',
      declaredValueUsd: '120.5',
      estimatedWeightLb: '1.5',
      suggestedCategory: 'FOUR_BY_FOUR',
    });
  });
});

describe('getPurchaseChanges', () => {
  it('is empty when nothing changed', () => {
    expect(getPurchaseChanges(purchase, unchanged)).toEqual({});
  });

  it('returns only the fields that differ', () => {
    expect(
      getPurchaseChanges(purchase, {
        ...unchanged,
        store: 'eBay',
        estimatedWeightLb: 2,
        suggestedCategory: 'COMMERCIAL',
      })
    ).toEqual({ store: 'eBay', estimatedWeightLb: 2, suggestedCategory: 'COMMERCIAL' });
  });
});
