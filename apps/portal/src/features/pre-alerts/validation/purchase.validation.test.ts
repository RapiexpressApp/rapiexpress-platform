import { describe, expect, it } from 'vitest';

import { purchaseFormSchema } from './purchase.validation';

const valid = {
  store: 'Amazon',
  trackingNumber: 'TBA123456789',
  description: 'Audífonos inalámbricos',
  declaredValueUsd: '120.50',
  estimatedWeightLb: '1.5',
  suggestedCategory: 'FOUR_BY_FOUR',
};

function messagesFor(input: Record<string, unknown>, path: string): string[] {
  const result = purchaseFormSchema.safeParse({ ...valid, ...input });
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path[0] === path).map((i) => i.message);
}

describe('purchaseFormSchema', () => {
  it('turns the typed amounts into numbers', () => {
    const result = purchaseFormSchema.parse(valid);

    expect(result.declaredValueUsd).toBe(120.5);
    expect(result.estimatedWeightLb).toBe(1.5);
  });

  it.each([
    ['45,90', 45.9],
    [' 45.9 ', 45.9],
    ['.5', 0.5],
    ['7', 7],
  ])('accepts %j as an amount', (raw, expected) => {
    const result = purchaseFormSchema.parse({ ...valid, declaredValueUsd: raw });

    expect(result.declaredValueUsd).toBe(expected);
  });

  it('normalizes the guide and trims the text fields', () => {
    const result = purchaseFormSchema.parse({
      ...valid,
      store: '  Amazon ',
      trackingNumber: ' tba-1234 5678 ',
      description: ' Audífonos ',
    });

    expect(result.store).toBe('Amazon');
    expect(result.trackingNumber).toBe('TBA12345678');
    expect(result.description).toBe('Audífonos');
  });

  it.each(['declaredValueUsd', 'estimatedWeightLb'])('requires %s when it is empty', (field) => {
    expect(messagesFor({ [field]: '   ' }, field)).toHaveLength(1);
    expect(messagesFor({ [field]: '' }, field)[0]).toMatch(/es obligatorio\.$/);
  });

  it.each(['abc', '1e3', '1.234,50', '-5', '12 USD'])('rejects %j as a non-number', (raw) => {
    expect(messagesFor({ declaredValueUsd: raw }, 'declaredValueUsd')).toEqual([
      'El valor declarado debe ser un número.',
    ]);
  });

  it('rejects a zero amount', () => {
    expect(messagesFor({ estimatedWeightLb: '0' }, 'estimatedWeightLb')).toEqual([
      'El peso estimado debe ser mayor que 0.',
    ]);
  });

  it('rejects amounts over the limits and with more than two decimals', () => {
    expect(messagesFor({ declaredValueUsd: '100000.01' }, 'declaredValueUsd')).toHaveLength(1);
    expect(messagesFor({ declaredValueUsd: '100000' }, 'declaredValueUsd')).toHaveLength(0);
    expect(messagesFor({ estimatedWeightLb: '1000.5' }, 'estimatedWeightLb')).toHaveLength(1);
    expect(messagesFor({ declaredValueUsd: '1.234' }, 'declaredValueUsd')).toEqual([
      'El valor declarado admite como máximo 2 decimales.',
    ]);
  });

  it('requires the store, the description and a valid guide', () => {
    expect(messagesFor({ store: '  ' }, 'store')).toEqual(['Ingresa la tienda.']);
    expect(messagesFor({ description: '' }, 'description')).toEqual(['Ingresa la descripción.']);
    expect(messagesFor({ trackingNumber: 'ab1' }, 'trackingNumber')).toEqual([
      'La guía debe tener entre 6 y 64 letras o números.',
    ]);
  });

  it('requires choosing a category', () => {
    expect(messagesFor({ suggestedCategory: '' }, 'suggestedCategory')).toEqual([
      'Selecciona una categoría.',
    ]);
  });
});
