import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { createPackagesApi } from './packages.api.ts';
import {
  assignCustomerPayloadSchema,
  linkPurchasePayloadSchema,
  openIncidentPayloadSchema,
  receivePackagePayloadSchema,
  resolveIncidentPayloadSchema,
  transitionPackagePayloadSchema,
  updatePackagePayloadSchema,
} from './packages.schemas.ts';
import { queryKeys } from './query-keys.ts';
import { setAccessToken } from './token-store.ts';

const packagesApi = createPackagesApi(createApiClient({ baseURL: '/api' }));

const customerId = '5f1c6e43-8f0e-4a39-a5d3-0d6f2f5a7f10';
const purchaseId = '0b9c0f3a-6d2e-4e0b-9a43-1c7f6a2d9e55';

const customer = { id: customerId, name: 'Jane', lastName: 'Doe', lockerCode: 'MI-00001' };
const actor = { id: 'u1', name: 'Olga', lastName: 'Pérez' };

const detail = {
  id: 'k1',
  warehouseNumber: 'WH-000042',
  trackingNumber: '1Z999AA10123456784',
  status: 'IN_WAREHOUSE',
  customer,
  purchaseId,
  weightLb: 2.5,
  weightKg: 1.13,
  packageType: 'NORMAL',
  category: 'MIGRANT',
  declaredValueUsd: 59.99,
  description: 'Running shoes',
  notes: null,
  duplicateConfirmed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  label: { warehouseNumber: 'WH-000042', customerName: 'Jane Doe', lockerCode: 'MI-00001' },
};

const incident = {
  id: 'i1',
  packageId: 'k1',
  type: 'DAMAGED',
  reason: 'Box crushed on arrival',
  openedBy: actor,
  openedAt: '2026-01-02T00:00:00.000Z',
  resolvedBy: null,
  resolvedAt: null,
  resolutionNote: null,
};

const staffDetail = {
  ...detail,
  purchase: {
    id: purchaseId,
    store: 'Amazon',
    trackingNumber: '1Z999AA10123456784',
    declaredValueUsd: 59.99,
    estimatedWeightLb: 2.5,
    suggestedCategory: 'MIGRANT',
    createdAt: '2025-12-30T00:00:00.000Z',
  },
  events: [
    {
      fromStatus: null,
      toStatus: 'IN_WAREHOUSE',
      source: 'RECEPTION',
      actor,
      occurredAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  allowedTransitions: ['CONSOLIDATED', 'SHIPPED'],
  openIncident: incident,
  incidents: [incident],
};

const listItem = {
  id: 'k1',
  warehouseNumber: 'WH-000042',
  trackingNumber: '1Z999AA10123456784',
  status: 'IN_WAREHOUSE',
  customer: null,
  weightLb: 2.5,
  weightKg: 1.13,
  category: null,
  declaredValueUsd: null,
  hasOpenIncident: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const lookup = {
  trackingNumber: '1Z999AA10123456784',
  existingPackages: [
    {
      id: 'k0',
      warehouseNumber: 'WH-000041',
      status: 'SHIPPED',
      customerId: null,
      createdAt: '2025-12-31T00:00:00.000Z',
    },
  ],
  matches: [
    {
      purchaseId,
      customer,
      store: 'Amazon',
      trackingNumber: '1Z999AA10123456784',
      description: 'Running shoes',
      declaredValueUsd: 59.99,
      estimatedWeightLb: 2.5,
      suggestedCategory: 'MIGRANT',
      createdAt: '2025-12-30T00:00:00.000Z',
    },
  ],
};

async function bodyOf(request: Request): Promise<unknown> {
  return request.json();
}

describe('packagesApi.lookup', () => {
  it('sends the normalized guide and parses matches and existing packages', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/packages/reception/lookup', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(lookup);
      })
    );

    const result = await packagesApi.lookup(' 1z999-aa1 0123456784\r\n');

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      trackingNumber: '1Z999AA10123456784',
    });
    expect(result).toEqual(lookup);
  });

  it('accepts a lookup without matches and a match without a customer', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages/reception/lookup', () =>
        HttpResponse.json({
          ...lookup,
          existingPackages: [],
          matches: [{ ...lookup.matches[0], customer: null }],
        })
      )
    );

    const result = await packagesApi.lookup('1Z999AA10123456784');

    expect(result.existingPackages).toEqual([]);
    expect(result.matches[0]?.customer).toBeNull();
  });

  it('rejects an invalid guide before hitting the network', async () => {
    await expect(packagesApi.lookup('AB-12')).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages/reception/lookup', () =>
        HttpResponse.json({ ...lookup, matches: [{ ...lookup.matches[0], purchaseId: undefined }] })
      )
    );

    await expect(packagesApi.lookup('1Z999AA10123456784')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.receive', () => {
  const payload = {
    trackingNumber: '1Z999AA10123456784',
    weightLb: 2.5,
  };

  it('posts the normalized payload and returns the package with its label', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(detail, { status: 201 });
      })
    );

    const result = await packagesApi.receive({
      ...payload,
      trackingNumber: ' 1z999-aa1 0123456784 ',
      purchaseId,
      customerId,
      packageType: 'FRAGILE',
      category: 'MIGRANT',
      declaredValueUsd: 59.99,
      description: ' Running shoes ',
      notes: 'Box is dented',
      confirmDuplicate: true,
    });

    expect(body).toEqual({
      ...payload,
      purchaseId,
      customerId,
      packageType: 'FRAGILE',
      category: 'MIGRANT',
      declaredValueUsd: 59.99,
      description: 'Running shoes',
      notes: 'Box is dented',
      confirmDuplicate: true,
    });
    expect(result.label).toEqual(detail.label);
    expect(result.id).toBe('k1');
  });

  it('sends only the required fields when nothing else is provided', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(
          {
            ...detail,
            customer: null,
            purchaseId: null,
            label: { warehouseNumber: 'WH-000042', customerName: null, lockerCode: null },
          },
          { status: 201 }
        );
      })
    );

    const result = await packagesApi.receive(payload);

    expect(body).toEqual(payload);
    expect(result).toMatchObject({ customer: null, purchaseId: null });
    expect(result.label).toEqual({
      warehouseNumber: 'WH-000042',
      customerName: null,
      lockerCode: null,
    });
  });

  it('rejects a payload without weight before hitting the network', async () => {
    await expect(
      packagesApi.receive({ trackingNumber: '1Z999AA10123456784' } as never)
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(
      http.post('*/api/packages', () =>
        HttpResponse.json({ ...detail, label: null }, { status: 201 })
      )
    );

    await expect(packagesApi.receive(payload)).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.list', () => {
  it('requests the page with every filter and parses the response', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/packages', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [listItem], page: 2, pageSize: 10, total: 11 });
      })
    );

    const result = await packagesApi.list({
      page: 2,
      pageSize: 10,
      search: ' WH-0000 ',
      status: 'IN_WAREHOUSE',
      unassigned: true,
      hasIncident: false,
    });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '2',
      pageSize: '10',
      search: 'WH-0000',
      status: 'IN_WAREHOUSE',
      unassigned: 'true',
      hasIncident: 'false',
    });
    expect(result).toEqual({ items: [listItem], page: 2, pageSize: 10, total: 11 });
  });

  it('omits every filter that is not set', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/packages', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
      })
    );

    await packagesApi.list({ page: 1, pageSize: 20, search: '  ' });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({ page: '1', pageSize: '20' });
  });

  it('accepts an assigned package with an open incident', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages', () =>
        HttpResponse.json({
          items: [
            {
              ...listItem,
              customer,
              category: 'COMMERCIAL',
              declaredValueUsd: 10,
              hasOpenIncident: true,
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    const result = await packagesApi.list({ page: 1, pageSize: 20 });

    expect(result.items[0]).toMatchObject({
      customer,
      category: 'COMMERCIAL',
      hasOpenIncident: true,
    });
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages', () =>
        HttpResponse.json({
          items: [{ ...listItem, status: 'LOST' }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    await expect(packagesApi.list({ page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.get', () => {
  it('requests the package by id and parses the staff detail', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/packages/k1', () => HttpResponse.json(staffDetail)));

    const result = await packagesApi.get('k1');

    expect(result).toEqual(staffDetail);
    expect(result.allowedTransitions).toEqual(['CONSOLIDATED', 'SHIPPED']);
    expect(result.openIncident?.id).toBe('i1');
  });

  it('accepts a package without purchase, incidents or allowed transitions', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages/k1', () =>
        HttpResponse.json({
          ...staffDetail,
          purchase: null,
          purchaseId: null,
          customer: null,
          status: 'DELIVERED',
          allowedTransitions: [],
          openIncident: null,
          incidents: [],
        })
      )
    );

    const result = await packagesApi.get('k1');

    expect(result).toMatchObject({
      purchase: null,
      allowedTransitions: [],
      openIncident: null,
      incidents: [],
    });
  });

  it('rejects a detail without the events', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/packages/k1', () => HttpResponse.json(detail)));

    await expect(packagesApi.get('k1')).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects an event whose actor is missing', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/packages/k1', () =>
        HttpResponse.json({
          ...staffDetail,
          events: [{ ...staffDetail.events[0], actor: undefined }],
        })
      )
    );

    await expect(packagesApi.get('k1')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.update', () => {
  it('patches only the provided fields and returns the staff detail', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.patch('*/api/packages/k1', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json({ ...staffDetail, weightLb: 3, notes: 'Repacked' });
      })
    );

    const result = await packagesApi.update('k1', { weightLb: 3, notes: ' Repacked ' });

    expect(body).toEqual({ weightLb: 3, notes: 'Repacked' });
    expect(result).toMatchObject({ weightLb: 3, notes: 'Repacked' });
    expect(result.events).toHaveLength(1);
  });

  it('rejects an empty payload before hitting the network', async () => {
    await expect(packagesApi.update('k1', {})).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.transition', () => {
  it('posts the target status and returns the staff detail', async () => {
    setAccessToken('tok');
    let body: unknown;
    let method: string | undefined;
    server.use(
      http.post('*/api/packages/k1/transitions', async ({ request }) => {
        method = request.method;
        body = await bodyOf(request);
        return HttpResponse.json({ ...staffDetail, status: 'SHIPPED', allowedTransitions: [] });
      })
    );

    const result = await packagesApi.transition('k1', 'SHIPPED');

    expect(method).toBe('POST');
    expect(body).toEqual({ to: 'SHIPPED' });
    expect(result.status).toBe('SHIPPED');
  });

  it('rejects an unknown status before hitting the network', async () => {
    await expect(packagesApi.transition('k1', 'LOST' as never)).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi incidents', () => {
  it('opens an incident and returns it', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages/k1/incidents', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(incident, { status: 201 });
      })
    );

    const result = await packagesApi.openIncident('k1', {
      type: 'DAMAGED',
      reason: ' Box crushed on arrival ',
    });

    expect(body).toEqual({ type: 'DAMAGED', reason: 'Box crushed on arrival' });
    expect(result).toEqual(incident);
  });

  it('rejects an incident without a reason before hitting the network', async () => {
    await expect(
      packagesApi.openIncident('k1', { type: 'LOST', reason: '  ' })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('resolves an incident with a note and returns the resolved incident', async () => {
    setAccessToken('tok');
    let body: unknown;
    const resolved = {
      ...incident,
      resolvedBy: actor,
      resolvedAt: '2026-01-03T00:00:00.000Z',
      resolutionNote: 'Repacked and inspected',
    };
    server.use(
      http.post('*/api/packages/k1/incidents/i1/resolve', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(resolved);
      })
    );

    const result = await packagesApi.resolveIncident('k1', 'i1', {
      resolutionNote: 'Repacked and inspected',
    });

    expect(body).toEqual({ resolutionNote: 'Repacked and inspected' });
    expect(result).toEqual(resolved);
  });

  it('resolves an incident without a note by sending an empty body', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages/k1/incidents/i1/resolve', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json({
          ...incident,
          resolvedBy: actor,
          resolvedAt: '2026-01-03T00:00:00.000Z',
        });
      })
    );

    await packagesApi.resolveIncident('k1', 'i1');

    expect(body).toEqual({});
  });

  it('rejects an incident response with an unknown type', async () => {
    setAccessToken('tok');
    server.use(
      http.post('*/api/packages/k1/incidents', () =>
        HttpResponse.json({ ...incident, type: 'STOLEN' }, { status: 201 })
      )
    );

    await expect(
      packagesApi.openIncident('k1', { type: 'DAMAGED', reason: 'Crushed' })
    ).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.assignCustomer', () => {
  it('posts the customer id and returns the package detail', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages/k1/assign-customer', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(detail);
      })
    );

    const result = await packagesApi.assignCustomer('k1', customerId);

    expect(body).toEqual({ customerId });
    expect(result.customer).toEqual(customer);
  });

  it('rejects an invalid customer id before hitting the network', async () => {
    await expect(packagesApi.assignCustomer('k1', 'nope')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('packagesApi.linkPurchase', () => {
  it('posts the purchase id and returns the package detail', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/packages/k1/link-purchase', async ({ request }) => {
        body = await bodyOf(request);
        return HttpResponse.json(detail);
      })
    );

    const result = await packagesApi.linkPurchase('k1', purchaseId);

    expect(body).toEqual({ purchaseId });
    expect(result.purchaseId).toBe(purchaseId);
  });

  it('rejects an invalid purchase id before hitting the network', async () => {
    await expect(packagesApi.linkPurchase('k1', 'nope')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('receivePackagePayloadSchema', () => {
  const valid = { trackingNumber: '1Z999AA10123456784', weightLb: 2.5 };

  it('accepts the minimal payload and the upper limits', () => {
    expect(receivePackagePayloadSchema.safeParse(valid).success).toBe(true);
    expect(
      receivePackagePayloadSchema.safeParse({
        ...valid,
        weightLb: 1000,
        declaredValueUsd: 100000,
        description: 'd'.repeat(500),
        notes: 'n'.repeat(1000),
      }).success
    ).toBe(true);
  });

  it.each([
    ['missing weight', { weightLb: undefined }],
    ['zero weight', { weightLb: 0 }],
    ['weight over the maximum', { weightLb: 1000.01 }],
    ['weight with 3 decimals', { weightLb: 2.505 }],
    ['short tracking number', { trackingNumber: 'AB-12' }],
    ['unknown package type', { packageType: 'HEAVY' }],
    ['unknown category', { category: 'OTHER' }],
    ['zero declared value', { declaredValueUsd: 0 }],
    ['declared value over the maximum', { declaredValueUsd: 100000.01 }],
    ['blank description', { description: '  ' }],
    ['description over 500 chars', { description: 'd'.repeat(501) }],
    ['notes over 1000 chars', { notes: 'n'.repeat(1001) }],
    ['invalid purchase id', { purchaseId: 'nope' }],
    ['invalid customer id', { customerId: 'nope' }],
    ['non boolean confirmDuplicate', { confirmDuplicate: 'yes' }],
    ['null customer id', { customerId: null }],
    ['null notes', { notes: null }],
  ])('rejects %s', (_label, override) => {
    expect(receivePackagePayloadSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('can be extended by the apps', () => {
    const extended = receivePackagePayloadSchema.extend({
      customerQuery: receivePackagePayloadSchema.shape.description,
    });

    expect(extended.safeParse({ ...valid, customerQuery: 'jane' }).success).toBe(true);
  });
});

describe('updatePackagePayloadSchema', () => {
  it('accepts a partial payload', () => {
    expect(updatePackagePayloadSchema.parse({ category: 'COMMERCIAL' })).toEqual({
      category: 'COMMERCIAL',
    });
  });

  it('rejects an empty payload', () => {
    expect(updatePackagePayloadSchema.safeParse({}).success).toBe(false);
  });

  it('rejects null fields and invalid values', () => {
    expect(updatePackagePayloadSchema.safeParse({ description: null }).success).toBe(false);
    expect(updatePackagePayloadSchema.safeParse({ weightLb: -1 }).success).toBe(false);
    expect(updatePackagePayloadSchema.safeParse({ notes: 'n'.repeat(1001) }).success).toBe(false);
  });
});

describe('small payload schemas', () => {
  it('validates the transition target', () => {
    expect(transitionPackagePayloadSchema.safeParse({ to: 'AT_AGENCY' }).success).toBe(true);
    expect(transitionPackagePayloadSchema.safeParse({ to: 'ARCHIVED' }).success).toBe(false);
  });

  it('validates the incident type and reason', () => {
    expect(
      openIncidentPayloadSchema.safeParse({ type: 'OTHER', reason: 'r'.repeat(500) }).success
    ).toBe(true);
    expect(
      openIncidentPayloadSchema.safeParse({ type: 'OTHER', reason: 'r'.repeat(501) }).success
    ).toBe(false);
    expect(openIncidentPayloadSchema.safeParse({ type: 'BROKEN', reason: 'x' }).success).toBe(
      false
    );
  });

  it('keeps the resolution note optional but bounded', () => {
    expect(resolveIncidentPayloadSchema.safeParse({}).success).toBe(true);
    expect(
      resolveIncidentPayloadSchema.safeParse({ resolutionNote: 'n'.repeat(500) }).success
    ).toBe(true);
    expect(
      resolveIncidentPayloadSchema.safeParse({ resolutionNote: 'n'.repeat(501) }).success
    ).toBe(false);
    expect(resolveIncidentPayloadSchema.safeParse({ resolutionNote: null }).success).toBe(false);
  });

  it('requires uuids to assign a customer and link a purchase', () => {
    expect(assignCustomerPayloadSchema.safeParse({ customerId }).success).toBe(true);
    expect(assignCustomerPayloadSchema.safeParse({ customerId: 'x' }).success).toBe(false);
    expect(linkPurchasePayloadSchema.safeParse({ purchaseId }).success).toBe(true);
    expect(linkPurchasePayloadSchema.safeParse({}).success).toBe(false);
  });
});

describe('packages query keys', () => {
  it('scopes list, detail and lookup keys under the packages root', () => {
    const params = { page: 1, pageSize: 20, status: 'IN_WAREHOUSE' as const, unassigned: true };

    expect(queryKeys.packages.all).toEqual(['packages']);
    expect(queryKeys.packages.list(params)).toEqual(['packages', 'list', params]);
    expect(queryKeys.packages.detail('k1')).toEqual(['packages', 'detail', 'k1']);
    expect(queryKeys.packages.lookup('1Z999AA10123456784')).toEqual([
      'packages',
      'lookup',
      '1Z999AA10123456784',
    ]);
    expect(queryKeys.packages.detail('k1').slice(0, 1)).toEqual(queryKeys.packages.all);
  });
});
