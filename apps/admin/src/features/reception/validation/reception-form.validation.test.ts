import { describe, expect, it } from 'vitest';

import { receptionFormSchema } from './reception-form.validation';

const valid = {
  weightLb: '2,5',
  packageType: '',
  category: '',
  declaredValueUsd: '',
  description: '',
  notes: '',
};

function messagesFor(input: Record<string, unknown>, path: string): string[] {
  const result = receptionFormSchema.safeParse({ ...valid, ...input });
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === path)
    .map((issue) => issue.message);
}

describe('receptionFormSchema', () => {
  it('turns the typed weight and value into numbers', () => {
    const result = receptionFormSchema.parse({
      ...valid,
      weightLb: '12,75',
      declaredValueUsd: '59.99',
    });

    expect(result.weightLb).toBe(12.75);
    expect(result.declaredValueUsd).toBe(59.99);
  });

  it('leaves every blank optional field out', () => {
    const result = receptionFormSchema.parse({
      ...valid,
      declaredValueUsd: '   ',
      description: '   ',
      notes: '\n',
    });

    expect(result).toEqual({ weightLb: 2.5 });
  });

  it('keeps the optional fields the operator filled in', () => {
    const result = receptionFormSchema.parse({
      weightLb: '3',
      packageType: 'FRAGILE',
      category: 'COMMERCIAL',
      declaredValueUsd: '10',
      description: '  Zapatos  ',
      notes: ' Caja abollada ',
    });

    expect(result).toEqual({
      weightLb: 3,
      packageType: 'FRAGILE',
      category: 'COMMERCIAL',
      declaredValueUsd: 10,
      description: 'Zapatos',
      notes: 'Caja abollada',
    });
  });

  it.each(['', '   '])('requires the weight when it is %j', (weightLb) => {
    expect(messagesFor({ weightLb }, 'weightLb')).toEqual(['El peso es obligatorio.']);
  });

  it.each(['abc', '1e3', '2 lb', '-1', '1,2,3'])('rejects %j as a weight', (weightLb) => {
    expect(messagesFor({ weightLb }, 'weightLb')).toEqual(['El peso debe ser un número.']);
  });

  it('applies the weight limits', () => {
    expect(messagesFor({ weightLb: '0' }, 'weightLb')).toEqual(['El peso debe ser mayor que 0.']);
    expect(messagesFor({ weightLb: '1000' }, 'weightLb')).toEqual([]);
    expect(messagesFor({ weightLb: '1000,5' }, 'weightLb')).toEqual([
      'El peso no puede superar 1000.',
    ]);
    expect(messagesFor({ weightLb: '1,234' }, 'weightLb')).toEqual([
      'El peso admite como máximo 2 decimales.',
    ]);
  });

  it('validates the declared value only when it is filled in', () => {
    expect(messagesFor({ declaredValueUsd: 'caro' }, 'declaredValueUsd')).toEqual([
      'El valor declarado debe ser un número.',
    ]);
    expect(messagesFor({ declaredValueUsd: '0' }, 'declaredValueUsd')).toEqual([
      'El valor declarado debe ser mayor que 0.',
    ]);
    expect(messagesFor({ declaredValueUsd: '100000' }, 'declaredValueUsd')).toEqual([]);
    expect(messagesFor({ declaredValueUsd: '100000,01' }, 'declaredValueUsd')).toHaveLength(1);
  });

  it('rejects a package type or category outside the allowed ones', () => {
    expect(messagesFor({ packageType: 'BOX' }, 'packageType')).toEqual([
      'Selecciona un tipo de paquete.',
    ]);
    expect(messagesFor({ category: 'OTHER' }, 'category')).toEqual(['Selecciona una categoría.']);
  });

  it('limits the description and the notes', () => {
    expect(messagesFor({ description: 'a'.repeat(500) }, 'description')).toEqual([]);
    expect(messagesFor({ description: 'a'.repeat(501) }, 'description')).toEqual([
      'La descripción no puede superar los 500 caracteres.',
    ]);
    expect(messagesFor({ notes: 'a'.repeat(1001) }, 'notes')).toEqual([
      'Las notas no pueden superar los 1000 caracteres.',
    ]);
  });
});
