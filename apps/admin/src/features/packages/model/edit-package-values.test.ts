import { describe, expect, it } from 'vitest';

import { packageStaffDetailFixture } from '@/test/packages-handlers';

import type { EditPackageFormValues } from '../validation/edit-package.validation';
import {
  findClearedFields,
  getPackageChanges,
  isPackageEditable,
  toEditFormValues,
} from './edit-package-values';

const detail = packageStaffDetailFixture({
  weightLb: 2.5,
  packageType: 'NORMAL',
  category: 'MIGRANT',
  declaredValueUsd: 59.99,
  description: 'Zapatos deportivos',
  notes: 'Caja golpeada',
});

const unchanged: EditPackageFormValues = {
  weightLb: 2.5,
  packageType: 'NORMAL',
  category: 'MIGRANT',
  declaredValueUsd: 59.99,
  description: 'Zapatos deportivos',
  notes: 'Caja golpeada',
};

describe('isPackageEditable', () => {
  it.each(['IN_WAREHOUSE', 'CONSOLIDATED', 'IN_BAG'] as const)('allows %s', (status) => {
    expect(isPackageEditable(status)).toBe(true);
  });

  it.each(['SHIPPED', 'IN_CUSTOMS', 'AT_AGENCY', 'READY_FOR_PICKUP', 'DELIVERED'] as const)(
    'blocks %s',
    (status) => {
      expect(isPackageEditable(status)).toBe(false);
    }
  );
});

describe('toEditFormValues', () => {
  it('prefills the numbers with a decimal comma', () => {
    const values = toEditFormValues(detail);

    expect(values.weightLb).toBe('2,5');
    expect(values.declaredValueUsd).toBe('59,99');
  });

  it('keeps a whole weight whole and pads the value to cents', () => {
    const values = toEditFormValues(
      packageStaffDetailFixture({ weightLb: 3, declaredValueUsd: 10 })
    );

    expect(values.weightLb).toBe('3');
    expect(values.declaredValueUsd).toBe('10,00');
  });

  it('copies the select and text fields', () => {
    expect(toEditFormValues(detail)).toMatchObject({
      packageType: 'NORMAL',
      category: 'MIGRANT',
      description: 'Zapatos deportivos',
      notes: 'Caja golpeada',
    });
  });

  it('leaves the missing fields blank', () => {
    const values = toEditFormValues(
      packageStaffDetailFixture({
        category: null,
        declaredValueUsd: null,
        description: null,
        notes: null,
      })
    );

    expect(values).toMatchObject({
      category: '',
      declaredValueUsd: '',
      description: '',
      notes: '',
    });
  });
});

describe('getPackageChanges', () => {
  it('is empty when nothing changed', () => {
    expect(getPackageChanges(detail, unchanged)).toEqual({});
  });

  it('sends only the fields that changed', () => {
    expect(getPackageChanges(detail, { ...unchanged, weightLb: 3.25 })).toEqual({ weightLb: 3.25 });
    expect(getPackageChanges(detail, { ...unchanged, packageType: 'FRAGILE' })).toEqual({
      packageType: 'FRAGILE',
    });
    expect(getPackageChanges(detail, { ...unchanged, category: 'COMMERCIAL' })).toEqual({
      category: 'COMMERCIAL',
    });
    expect(getPackageChanges(detail, { ...unchanged, declaredValueUsd: 80 })).toEqual({
      declaredValueUsd: 80,
    });
    expect(getPackageChanges(detail, { ...unchanged, description: 'Camisas' })).toEqual({
      description: 'Camisas',
    });
    expect(getPackageChanges(detail, { ...unchanged, notes: 'Sin daños' })).toEqual({
      notes: 'Sin daños',
    });
  });

  it('sends several changes together', () => {
    const changes = getPackageChanges(detail, { ...unchanged, weightLb: 4, notes: 'Revisada' });

    expect(changes).toEqual({ weightLb: 4, notes: 'Revisada' });
  });

  it('sets a field that was missing', () => {
    const bare = packageStaffDetailFixture({
      category: null,
      declaredValueUsd: null,
      description: null,
      notes: null,
    });

    expect(
      getPackageChanges(bare, {
        weightLb: 2.5,
        packageType: 'NORMAL',
        category: 'MIGRANT',
        declaredValueUsd: 10,
        description: 'Zapatos',
        notes: 'Nota',
      })
    ).toEqual({ category: 'MIGRANT', declaredValueUsd: 10, description: 'Zapatos', notes: 'Nota' });
  });

  it('never sends a blank field, which would be null or an empty body', () => {
    const bare = packageStaffDetailFixture({
      category: null,
      declaredValueUsd: null,
      description: null,
      notes: null,
    });

    expect(getPackageChanges(bare, { weightLb: 2.5, packageType: 'NORMAL' })).toEqual({});
    expect(getPackageChanges(detail, { weightLb: 2.5, packageType: 'NORMAL' })).toEqual({});
  });
});

describe('findClearedFields', () => {
  it('finds nothing when every filled field is still filled', () => {
    expect(findClearedFields(detail, unchanged)).toEqual([]);
  });

  it('finds the filled fields that were emptied, which the API cannot clear', () => {
    const emptied: EditPackageFormValues = { weightLb: 2.5, packageType: 'NORMAL' };

    expect(findClearedFields(detail, emptied)).toEqual([
      'declaredValueUsd',
      'description',
      'notes',
    ]);
  });

  it('does not count a field that was blank to begin with', () => {
    const bare = packageStaffDetailFixture({
      declaredValueUsd: null,
      description: null,
      notes: null,
    });

    expect(findClearedFields(bare, { weightLb: 2.5, packageType: 'NORMAL' })).toEqual([]);
  });
});
