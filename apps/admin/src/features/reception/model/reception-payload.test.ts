import { receivePackagePayloadSchema } from '@rapiexpress/api-client/packages.schemas';
import { describe, expect, it } from 'vitest';

import {
  CUSTOMER_ID,
  customerSummaryFixture,
  PURCHASE_ID,
  receptionMatchFixture,
  TRACKING_NUMBER,
} from '@/test/reception-handlers';

import { buildReceivePayload } from './reception-payload';

const base = { trackingNumber: TRACKING_NUMBER, values: { weightLb: 2.5 } };

describe('buildReceivePayload', () => {
  it('sends only the purchase when the guide matched one', () => {
    const payload = buildReceivePayload({
      ...base,
      target: { kind: 'purchase', match: receptionMatchFixture() },
    });

    expect(payload).toEqual({
      trackingNumber: TRACKING_NUMBER,
      purchaseId: PURCHASE_ID,
      weightLb: 2.5,
    });
    expect(payload).not.toHaveProperty('customerId');
  });

  it('sends the picked customer when there is no purchase', () => {
    const payload = buildReceivePayload({
      ...base,
      target: { kind: 'customer', customer: customerSummaryFixture() },
    });

    expect(payload).toEqual({
      trackingNumber: TRACKING_NUMBER,
      customerId: CUSTOMER_ID,
      weightLb: 2.5,
    });
    expect(payload).not.toHaveProperty('purchaseId');
  });

  it('sends neither id for an unassigned package', () => {
    const payload = buildReceivePayload({ ...base, target: { kind: 'unassigned' } });

    expect(payload).toEqual({ trackingNumber: TRACKING_NUMBER, weightLb: 2.5 });
    expect(Object.keys(payload).sort()).toEqual(['trackingNumber', 'weightLb']);
  });

  it('omits the optional fields that are blank instead of nulling them', () => {
    const payload = buildReceivePayload({
      ...base,
      target: { kind: 'unassigned' },
      values: {
        weightLb: 2.5,
        packageType: undefined,
        category: undefined,
        declaredValueUsd: undefined,
        description: undefined,
        notes: undefined,
      },
    });

    expect(Object.keys(payload).sort()).toEqual(['trackingNumber', 'weightLb']);
    expect(JSON.stringify(payload)).not.toContain('null');
  });

  it('keeps every optional field that has a value', () => {
    const payload = buildReceivePayload({
      ...base,
      target: { kind: 'unassigned' },
      values: {
        weightLb: 2.5,
        packageType: 'FRAGILE',
        category: 'MIGRANT',
        declaredValueUsd: 59.99,
        description: 'Zapatos',
        notes: 'Caja abollada',
      },
    });

    expect(payload).toMatchObject({
      packageType: 'FRAGILE',
      category: 'MIGRANT',
      declaredValueUsd: 59.99,
      description: 'Zapatos',
      notes: 'Caja abollada',
    });
  });

  it('confirms the duplicate only when the operator did', () => {
    const target = { kind: 'unassigned' } as const;

    expect(buildReceivePayload({ ...base, target })).not.toHaveProperty('confirmDuplicate');
    expect(buildReceivePayload({ ...base, target, confirmDuplicate: false })).not.toHaveProperty(
      'confirmDuplicate'
    );
    expect(buildReceivePayload({ ...base, target, confirmDuplicate: true })).toHaveProperty(
      'confirmDuplicate',
      true
    );
  });

  it('builds a payload the api-client schema accepts', () => {
    const payload = buildReceivePayload({
      ...base,
      target: { kind: 'purchase', match: receptionMatchFixture() },
      confirmDuplicate: true,
    });

    expect(receivePackagePayloadSchema.safeParse(payload).success).toBe(true);
  });
});
