import { describe, expect, it } from 'vitest';

import { customerSummaryFixture, receptionMatchFixture } from '@/test/reception-handlers';

import { receptionFormSchema } from '../validation/reception-form.validation';
import { getInitialFormInput } from './reception-form-values';

describe('getInitialFormInput', () => {
  const blank = {
    weightLb: '',
    packageType: '',
    category: '',
    declaredValueUsd: '',
    description: '',
    notes: '',
  };

  it('starts empty without a purchase', () => {
    expect(getInitialFormInput({ kind: 'unassigned' })).toEqual(blank);
    expect(getInitialFormInput({ kind: 'customer', customer: customerSummaryFixture() })).toEqual(
      blank
    );
  });

  it('prefills the details the customer declared', () => {
    const input = getInitialFormInput({
      kind: 'purchase',
      match: receptionMatchFixture({
        description: 'Zapatos deportivos',
        declaredValueUsd: 59.9,
        suggestedCategory: 'COMMERCIAL',
      }),
    });

    expect(input).toEqual({
      ...blank,
      description: 'Zapatos deportivos',
      declaredValueUsd: '59,90',
      category: 'COMMERCIAL',
    });
  });

  it('leaves the weight empty so the operator types the scale reading', () => {
    const input = getInitialFormInput({
      kind: 'purchase',
      match: receptionMatchFixture({ estimatedWeightLb: 2.5 }),
    });

    expect(input.weightLb).toBe('');
  });

  it('produces values the form schema accepts once the weight is typed', () => {
    const input = getInitialFormInput({
      kind: 'purchase',
      match: receptionMatchFixture({ declaredValueUsd: 1234.5 }),
    });

    const result = receptionFormSchema.parse({ ...input, weightLb: '3,2' });

    expect(result.declaredValueUsd).toBe(1234.5);
    expect(result.weightLb).toBe(3.2);
  });
});
