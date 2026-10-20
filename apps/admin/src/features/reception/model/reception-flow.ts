import type {
  ExistingPackage,
  PackageDetail,
  ReceptionLookup,
} from '@rapiexpress/api-client/packages.schemas';

import type {
  ReceptionFormInput,
  ReceptionFormValues,
} from '../validation/reception-form.validation';
import { getInitialFormInput } from './reception-form-values';
import type { ReceptionTarget } from './reception-target';

export type ReceptionPhase = 'scan' | 'target' | 'details' | 'confirm' | 'done';

export interface ReceptionState {
  phase: ReceptionPhase;
  trackingNumber: string | null;
  lookup: ReceptionLookup | null;
  duplicate: { packages: ExistingPackage[]; confirmed: boolean } | null;
  target: ReceptionTarget | null;
  formInput: ReceptionFormInput | null;
  values: ReceptionFormValues | null;
  received: PackageDetail | null;
  notice: string | null;
}

export type ReceptionAction =
  | { type: 'looked-up'; trackingNumber: string; lookup: ReceptionLookup }
  | { type: 'duplicate-confirmed' }
  | { type: 'duplicate-detected'; packages: ExistingPackage[] }
  | { type: 'target-chosen'; target: ReceptionTarget }
  | { type: 'target-reopened' }
  | { type: 'details-submitted'; input: ReceptionFormInput; values: ReceptionFormValues }
  | { type: 'details-reopened' }
  | { type: 'received'; received: PackageDetail }
  | { type: 'relookup-requested'; message: string }
  | { type: 'customer-rejected'; message: string }
  | { type: 'notice-dismissed' }
  | { type: 'restarted' };

export const INITIAL_RECEPTION_STATE: ReceptionState = {
  phase: 'scan',
  trackingNumber: null,
  lookup: null,
  duplicate: null,
  target: null,
  formInput: null,
  values: null,
  received: null,
  notice: null,
};

export function receptionReducer(state: ReceptionState, action: ReceptionAction): ReceptionState {
  switch (action.type) {
    case 'looked-up': {
      const { lookup, trackingNumber } = action;
      const base: ReceptionState = {
        ...INITIAL_RECEPTION_STATE,
        notice: state.notice,
        trackingNumber,
        lookup,
        duplicate:
          lookup.existingPackages.length > 0
            ? { packages: lookup.existingPackages, confirmed: false }
            : null,
      };
      const [onlyMatch] = lookup.matches;
      if (lookup.matches.length === 1 && onlyMatch) {
        const target: ReceptionTarget = { kind: 'purchase', match: onlyMatch };
        return { ...base, phase: 'details', target, formInput: getInitialFormInput(target) };
      }
      return { ...base, phase: 'target' };
    }
    case 'duplicate-confirmed':
      return state.duplicate
        ? { ...state, duplicate: { ...state.duplicate, confirmed: true } }
        : state;
    case 'duplicate-detected':
      return { ...state, duplicate: { packages: action.packages, confirmed: false } };
    case 'target-chosen':
      return {
        ...state,
        phase: 'details',
        target: action.target,
        formInput: getInitialFormInput(action.target),
        values: null,
        notice: null,
      };
    case 'target-reopened':
      return { ...state, phase: 'target', target: null, formInput: null, values: null };
    case 'details-submitted':
      return {
        ...state,
        phase: 'confirm',
        formInput: action.input,
        values: action.values,
        notice: null,
      };
    case 'details-reopened':
      return { ...state, phase: 'details' };
    case 'received':
      return { ...state, phase: 'done', received: action.received, notice: null };
    case 'relookup-requested':
      return {
        ...INITIAL_RECEPTION_STATE,
        trackingNumber: state.trackingNumber,
        notice: action.message,
      };
    case 'customer-rejected':
      return {
        ...state,
        phase: 'target',
        target: null,
        formInput: null,
        values: null,
        notice: action.message,
      };
    case 'notice-dismissed':
      return { ...state, notice: null };
    case 'restarted':
      return INITIAL_RECEPTION_STATE;
  }
}

export function isDuplicatePending(state: ReceptionState): boolean {
  return state.duplicate !== null && !state.duplicate.confirmed;
}

export function canChooseAnotherTarget(state: ReceptionState): boolean {
  return state.lookup !== null && state.lookup.matches.length !== 1;
}

export function getStepNumber(state: ReceptionState): number | null {
  if (state.phase === 'done') return null;
  if (state.phase === 'scan') return 1;
  if (state.phase === 'confirm') return 4;
  if (isDuplicatePending(state) || state.phase === 'target') return 2;
  return 3;
}
