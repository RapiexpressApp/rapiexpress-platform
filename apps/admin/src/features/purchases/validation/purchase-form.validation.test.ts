import { describe, expect, it } from 'vitest';

import { CUSTOMER_ID } from '@/test/reception-handlers';

import { type PurchaseFormInput, purchaseFormSchema } from './purchase-form.validation';

const valid: PurchaseFormInput = {
  customerId: CUSTOMER_ID,
  store: 'Amazon',
  trackingNumber: '1Z999AA10123456784',
  description: 'Zapatos deportivos',
  declaredValueUsd: '59,99',
  estimatedWeightLb: '2,5',
  suggestedCategory: 'MIGRANT',
};

function messagesOf(input: Partial<PurchaseFormInput>) {
  const result = purchaseFormSchema.safeParse({ ...valid, ...input });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
  );
}

describe('purchaseFormSchema', () => {
  it('turns decimal commas into numbers and keeps the customer', () => {
    expect(purchaseFormSchema.parse(valid)).toEqual({
      customerId: CUSTOMER_ID,
      store: 'Amazon',
      trackingNumber: '1Z999AA10123456784',
      description: 'Zapatos deportivos',
      declaredValueUsd: 59.99,
      estimatedWeightLb: 2.5,
      suggestedCategory: 'MIGRANT',
    });
  });

  it('accepts a decimal point too', () => {
    const values = purchaseFormSchema.parse({
      ...valid,
      declaredValueUsd: '59.99',
      estimatedWeightLb: '2.5',
    });

    expect(values.declaredValueUsd).toBe(59.99);
    expect(values.estimatedWeightLb).toBe(2.5);
  });

  it('normalizes the guide the way the backend does', () => {
    const values = purchaseFormSchema.parse({ ...valid, trackingNumber: ' 1z99-9aa1 0123456784 ' });

    expect(values.trackingNumber).toBe('1Z999AA10123456784');
  });

  it('trims the text fields', () => {
    const values = purchaseFormSchema.parse({
      ...valid,
      store: '  Amazon ',
      description: ' Hola ',
    });

    expect(values.store).toBe('Amazon');
    expect(values.description).toBe('Hola');
  });

  it('asks for every field when the form is blank', () => {
    expect(
      messagesOf({
        store: '',
        trackingNumber: '',
        description: '',
        declaredValueUsd: '',
        estimatedWeightLb: '',
        suggestedCategory: '',
      })
    ).toEqual({
      store: 'Ingresa la tienda.',
      trackingNumber: 'La guía debe tener entre 6 y 64 letras o números.',
      description: 'Ingresa la descripción.',
      declaredValueUsd: 'El valor declarado es obligatorio.',
      estimatedWeightLb: 'El peso estimado es obligatorio.',
      suggestedCategory: 'Selecciona una categoría.',
    });
  });

  it('needs a customer', () => {
    expect(messagesOf({ customerId: '' })).toEqual({
      customerId: 'El identificador no es válido.',
    });
  });

  it('rejects a guide with symbols or too short', () => {
    expect(messagesOf({ trackingNumber: 'AB#12' }).trackingNumber).toBe(
      'La guía debe tener entre 6 y 64 letras o números.'
    );
  });

  it('rejects texts longer than the backend accepts', () => {
    expect(messagesOf({ store: 's'.repeat(121) }).store).toBe(
      'La tienda no puede superar los 120 caracteres.'
    );
    expect(messagesOf({ description: 'd'.repeat(501) }).description).toBe(
      'La descripción no puede superar los 500 caracteres.'
    );
  });

  it.each([
    ['0', 'El valor declarado debe ser mayor que 0.'],
    ['abc', 'El valor declarado debe ser un número.'],
    ['1,005', 'El valor declarado admite como máximo 2 decimales.'],
    ['100000,01', 'El valor declarado no puede superar 100000.'],
  ])('rejects the declared value %j', (declaredValueUsd, message) => {
    expect(messagesOf({ declaredValueUsd }).declaredValueUsd).toBe(message);
  });

  it.each([
    ['0', 'El peso estimado debe ser mayor que 0.'],
    ['2,5 lb', 'El peso estimado debe ser un número.'],
    ['1000,01', 'El peso estimado no puede superar 1000.'],
  ])('rejects the estimated weight %j', (estimatedWeightLb, message) => {
    expect(messagesOf({ estimatedWeightLb }).estimatedWeightLb).toBe(message);
  });
});
