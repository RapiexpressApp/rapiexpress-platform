import { describe, expect, it } from 'vitest';

import {
  customerSummaryFixture,
  existingPackageFixture,
  OTHER_PURCHASE_ID,
  packageDetailFixture,
  receptionLookupFixture,
  receptionMatchFixture,
  TRACKING_NUMBER,
} from '@/test/reception-handlers';

import {
  canChooseAnotherTarget,
  getStepNumber,
  INITIAL_RECEPTION_STATE,
  isDuplicatePending,
  type ReceptionAction,
  receptionReducer,
  type ReceptionState,
} from './reception-flow';

function run(...actions: ReceptionAction[]): ReceptionState {
  return actions.reduce(receptionReducer, INITIAL_RECEPTION_STATE);
}

const match = receptionMatchFixture();
const otherMatch = receptionMatchFixture({ purchaseId: OTHER_PURCHASE_ID, store: 'Shein' });
const lookedUp = (lookup = receptionLookupFixture()): ReceptionAction => ({
  type: 'looked-up',
  trackingNumber: TRACKING_NUMBER,
  lookup,
});
const values = { weightLb: 2.5 };
const input = {
  weightLb: '2,5',
  packageType: '',
  category: '',
  declaredValueUsd: '',
  description: '',
  notes: '',
};

describe('receptionReducer', () => {
  it('starts on the scan step with nothing selected', () => {
    expect(INITIAL_RECEPTION_STATE).toMatchObject({
      phase: 'scan',
      trackingNumber: null,
      lookup: null,
      duplicate: null,
      target: null,
      received: null,
      notice: null,
    });
  });

  describe('looking up a guide', () => {
    it('goes straight to the details when exactly one purchase matches', () => {
      const state = run(lookedUp(receptionLookupFixture({ matches: [match] })));

      expect(state.phase).toBe('details');
      expect(state.target).toEqual({ kind: 'purchase', match });
      expect(state.formInput).toMatchObject({ description: match.description, weightLb: '' });
      expect(state.trackingNumber).toBe(TRACKING_NUMBER);
    });

    it('asks the operator to pick when several purchases match', () => {
      const state = run(lookedUp(receptionLookupFixture({ matches: [match, otherMatch] })));

      expect(state.phase).toBe('target');
      expect(state.target).toBeNull();
    });

    it('asks for a customer or an unassigned package when nothing matches', () => {
      const state = run(lookedUp());

      expect(state.phase).toBe('target');
      expect(state.target).toBeNull();
    });

    it('flags the packages already stored under the guide', () => {
      const existing = [existingPackageFixture()];
      const state = run(lookedUp(receptionLookupFixture({ existingPackages: existing })));

      expect(state.duplicate).toEqual({ packages: existing, confirmed: false });
      expect(isDuplicatePending(state)).toBe(true);
    });

    it('does not flag a duplicate for a new guide', () => {
      const state = run(lookedUp());

      expect(state.duplicate).toBeNull();
      expect(isDuplicatePending(state)).toBe(false);
    });
  });

  describe('duplicate warning', () => {
    const withDuplicate = lookedUp(
      receptionLookupFixture({ existingPackages: [existingPackageFixture()], matches: [match] })
    );

    it('keeps the step but lets the operator continue once confirmed', () => {
      const state = run(withDuplicate, { type: 'duplicate-confirmed' });

      expect(state.duplicate?.confirmed).toBe(true);
      expect(isDuplicatePending(state)).toBe(false);
      expect(state.phase).toBe('details');
    });

    it('ignores a confirmation when there is no duplicate', () => {
      expect(run(lookedUp(), { type: 'duplicate-confirmed' }).duplicate).toBeNull();
    });

    it('warns again, without losing the form, when another scan wins the race', () => {
      const raced = [existingPackageFixture({ id: 'k9', warehouseNumber: 'WH-000099' })];
      const state = run(
        lookedUp(receptionLookupFixture({ matches: [match] })),
        { type: 'details-submitted', input, values },
        { type: 'duplicate-detected', packages: raced }
      );

      expect(state.phase).toBe('confirm');
      expect(state.duplicate).toEqual({ packages: raced, confirmed: false });
      expect(state.values).toEqual(values);
      expect(isDuplicatePending(state)).toBe(true);
    });

    it('requires a new confirmation after a second race', () => {
      const packages = [existingPackageFixture()];
      const state = run(
        withDuplicate,
        { type: 'duplicate-confirmed' },
        { type: 'duplicate-detected', packages }
      );

      expect(state.duplicate?.confirmed).toBe(false);
    });
  });

  describe('choosing where the package goes', () => {
    const noMatch = lookedUp();

    it('prefills the form from the chosen purchase', () => {
      const state = run(lookedUp(receptionLookupFixture({ matches: [match, otherMatch] })), {
        type: 'target-chosen',
        target: { kind: 'purchase', match: otherMatch },
      });

      expect(state.phase).toBe('details');
      expect(state.target).toEqual({ kind: 'purchase', match: otherMatch });
      expect(state.formInput?.description).toBe(otherMatch.description);
    });

    it('starts an empty form for a searched customer', () => {
      const customer = customerSummaryFixture();
      const state = run(noMatch, { type: 'target-chosen', target: { kind: 'customer', customer } });

      expect(state.phase).toBe('details');
      expect(state.target).toEqual({ kind: 'customer', customer });
      expect(state.formInput).toMatchObject({ weightLb: '', description: '' });
    });

    it('starts an empty form for an unassigned package', () => {
      const state = run(noMatch, { type: 'target-chosen', target: { kind: 'unassigned' } });

      expect(state.target).toEqual({ kind: 'unassigned' });
    });

    it('goes back to the choice and forgets the typed details', () => {
      const state = run(
        noMatch,
        { type: 'target-chosen', target: { kind: 'unassigned' } },
        { type: 'details-submitted', input, values },
        { type: 'target-reopened' }
      );

      expect(state).toMatchObject({ phase: 'target', target: null, formInput: null, values: null });
    });

    it('only offers another choice when the guide did not match a single purchase', () => {
      expect(canChooseAnotherTarget(run(lookedUp()))).toBe(true);
      expect(
        canChooseAnotherTarget(
          run(lookedUp(receptionLookupFixture({ matches: [match, otherMatch] })))
        )
      ).toBe(true);
      expect(
        canChooseAnotherTarget(run(lookedUp(receptionLookupFixture({ matches: [match] }))))
      ).toBe(false);
      expect(canChooseAnotherTarget(INITIAL_RECEPTION_STATE)).toBe(false);
    });
  });

  describe('details and confirmation', () => {
    const atDetails = [
      lookedUp(),
      { type: 'target-chosen', target: { kind: 'unassigned' } },
    ] as const;

    it('moves to the confirmation with the typed and the parsed values', () => {
      const state = run(...atDetails, { type: 'details-submitted', input, values });

      expect(state).toMatchObject({ phase: 'confirm', formInput: input, values });
    });

    it('returns to the details keeping what was typed', () => {
      const state = run(
        ...atDetails,
        { type: 'details-submitted', input, values },
        { type: 'details-reopened' }
      );

      expect(state).toMatchObject({ phase: 'details', formInput: input });
    });

    it('finishes with the received package', () => {
      const received = packageDetailFixture();
      const state = run(
        ...atDetails,
        { type: 'details-submitted', input, values },
        { type: 'received', received }
      );

      expect(state).toMatchObject({ phase: 'done', received });
      expect(getStepNumber(state)).toBeNull();
    });
  });

  describe('failures', () => {
    it('goes back to scanning the same guide with an explanation when the purchase is stale', () => {
      const state = run(
        lookedUp(receptionLookupFixture({ matches: [match] })),
        { type: 'details-submitted', input, values },
        { type: 'relookup-requested', message: 'Consultamos de nuevo' }
      );

      expect(state).toMatchObject({
        phase: 'scan',
        trackingNumber: TRACKING_NUMBER,
        lookup: null,
        target: null,
        formInput: null,
        values: null,
        duplicate: null,
        notice: 'Consultamos de nuevo',
      });
    });

    it('keeps the explanation through the new lookup', () => {
      const state = run(
        lookedUp(receptionLookupFixture({ matches: [match] })),
        { type: 'relookup-requested', message: 'Consultamos de nuevo' },
        lookedUp(receptionLookupFixture({ matches: [otherMatch] }))
      );

      expect(state.notice).toBe('Consultamos de nuevo');
      expect(state.target).toEqual({ kind: 'purchase', match: otherMatch });
    });

    it('sends the operator back to the customer choice when the customer is inactive', () => {
      const customer = customerSummaryFixture();
      const state = run(
        lookedUp(),
        { type: 'target-chosen', target: { kind: 'customer', customer } },
        { type: 'details-submitted', input, values },
        { type: 'customer-rejected', message: 'Cliente inactivo' }
      );

      expect(state).toMatchObject({
        phase: 'target',
        target: null,
        formInput: null,
        values: null,
        notice: 'Cliente inactivo',
      });
    });

    it('clears the explanation once the operator moves on or dismisses it', () => {
      const withNotice = run(
        lookedUp(),
        { type: 'target-chosen', target: { kind: 'unassigned' } },
        { type: 'customer-rejected', message: 'Cliente inactivo' }
      );

      expect(receptionReducer(withNotice, { type: 'notice-dismissed' }).notice).toBeNull();
      expect(
        receptionReducer(withNotice, { type: 'target-chosen', target: { kind: 'unassigned' } })
          .notice
      ).toBeNull();
    });
  });

  it('forgets everything when restarted', () => {
    const state = run(
      lookedUp(
        receptionLookupFixture({ matches: [match], existingPackages: [existingPackageFixture()] })
      ),
      { type: 'details-submitted', input, values },
      { type: 'received', received: packageDetailFixture() },
      { type: 'restarted' }
    );

    expect(state).toEqual(INITIAL_RECEPTION_STATE);
  });

  describe('getStepNumber', () => {
    it('numbers the four steps and hides the number on the success screen', () => {
      expect(getStepNumber(INITIAL_RECEPTION_STATE)).toBe(1);
      expect(getStepNumber(run(lookedUp()))).toBe(2);
      expect(
        getStepNumber(run(lookedUp(), { type: 'target-chosen', target: { kind: 'unassigned' } }))
      ).toBe(3);
      expect(
        getStepNumber(
          run(
            lookedUp(),
            { type: 'target-chosen', target: { kind: 'unassigned' } },
            { type: 'details-submitted', input, values }
          )
        )
      ).toBe(4);
    });

    it('shows the duplicate warning as part of step 2', () => {
      const state = run(
        lookedUp(
          receptionLookupFixture({ existingPackages: [existingPackageFixture()], matches: [match] })
        )
      );

      expect(state.phase).toBe('details');
      expect(getStepNumber(state)).toBe(2);
    });
  });
});
