import { describe, expect, it } from 'vitest';

import { editPackageFormSchema } from './edit-package.validation';

const valid = {
  weightLb: '2,5',
  packageType: 'NORMAL',
  category: '',
  declaredValueUsd: '',
  description: '',
  notes: '',
};

function messagesFor(input: Record<string, unknown>, path: string): string[] {
  const result = editPackageFormSchema.safeParse({ ...valid, ...input });
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === path)
    .map((issue) => issue.message);
}

describe('editPackageFormSchema', () => {
  it('reads the decimal comma in the weight and the value', () => {
    const result = editPackageFormSchema.parse({
      ...valid,
      weightLb: '12,75',
      declaredValueUsd: '59,9',
    });

    expect(result.weightLb).toBe(12.75);
    expect(result.declaredValueUsd).toBe(59.9);
  });

  it('leaves the blank optional fields out', () => {
    const result = editPackageFormSchema.parse({
      ...valid,
      declaredValueUsd: '  ',
      description: '  ',
      notes: '\n',
    });

    expect(result).toEqual({ weightLb: 2.5, packageType: 'NORMAL' });
  });

  it('trims the text the operator typed', () => {
    const result = editPackageFormSchema.parse({ ...valid, description: '  Zapatos  ' });

    expect(result.description).toBe('Zapatos');
  });

  it.each(['', 'abc', '0', '-1', '1000,01', '2,555'])('rejects the weight %j', (weightLb) => {
    expect(messagesFor({ weightLb }, 'weightLb')).not.toHaveLength(0);
  });

  it('asks for the weight when it is blank', () => {
    expect(messagesFor({ weightLb: '' }, 'weightLb')).toEqual(['El peso es obligatorio.']);
  });

  it.each(['abc', '0', '100000,01'])('rejects the declared value %j', (declaredValueUsd) => {
    expect(messagesFor({ declaredValueUsd }, 'declaredValueUsd')).not.toHaveLength(0);
  });

  it('rejects text that is too long', () => {
    expect(messagesFor({ description: 'x'.repeat(501) }, 'description')).toEqual([
      'La descripción no puede superar los 500 caracteres.',
    ]);
    expect(messagesFor({ notes: 'x'.repeat(1001) }, 'notes')).toEqual([
      'Las notas no pueden superar los 1000 caracteres.',
    ]);
  });

  it('rejects an unknown type or category', () => {
    expect(messagesFor({ packageType: 'HEAVY' }, 'packageType')).not.toHaveLength(0);
    expect(messagesFor({ category: 'OTHER' }, 'category')).not.toHaveLength(0);
  });
});
