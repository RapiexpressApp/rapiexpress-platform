import type { ReceptionFormInput } from '../validation/reception-form.validation';
import type { ReceptionTarget } from './reception-target';

function toDecimalComma(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function getInitialFormInput(target: ReceptionTarget): ReceptionFormInput {
  const blank: ReceptionFormInput = {
    weightLb: '',
    packageType: '',
    category: '',
    declaredValueUsd: '',
    description: '',
    notes: '',
  };
  if (target.kind !== 'purchase') return blank;

  const { match } = target;
  return {
    ...blank,
    category: match.suggestedCategory,
    declaredValueUsd: toDecimalComma(match.declaredValueUsd),
    description: match.description,
  };
}
