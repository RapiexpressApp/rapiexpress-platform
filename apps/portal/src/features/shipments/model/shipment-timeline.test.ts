import type { TimelineStep } from '@rapiexpress/api-client/tracking.schemas';
import { describe, expect, it } from 'vitest';

import { buildShipmentTimeline } from './shipment-timeline';

const reached = (status: TimelineStep['status'], reachedAt: string): TimelineStep => ({
  status,
  reachedAt,
});

describe('buildShipmentTimeline', () => {
  it('always returns the five visible steps in order with Spanish labels', () => {
    const steps = buildShipmentTimeline('WAREHOUSE', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
    ]);

    expect(steps.map((step) => step.label)).toEqual([
      'Bodega',
      'Embarcado',
      'Aduana',
      'Agencia',
      'Entregado',
    ]);
  });

  it('marks the first step as current when the package just arrived', () => {
    const steps = buildShipmentTimeline('WAREHOUSE', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
    ]);

    expect(steps.map((step) => step.state)).toEqual([
      'current',
      'pending',
      'pending',
      'pending',
      'pending',
    ]);
    expect(steps[0]?.date).toBe('10 mar 2026');
    expect(steps.slice(1).every((step) => step.date === undefined)).toBe(true);
  });

  it('marks reached steps as done with their date and the status step as current', () => {
    const steps = buildShipmentTimeline('CUSTOMS', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
      reached('SHIPPED', '2026-03-12T12:00:00Z'),
      reached('CUSTOMS', '2026-03-15T12:00:00Z'),
    ]);

    expect(steps.map((step) => step.state)).toEqual([
      'done',
      'done',
      'current',
      'pending',
      'pending',
    ]);
    expect(steps.map((step) => step.date)).toEqual([
      '10 mar 2026',
      '12 mar 2026',
      '15 mar 2026',
      undefined,
      undefined,
    ]);
  });

  it('completes every step once the package is delivered', () => {
    const steps = buildShipmentTimeline('DELIVERED', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
      reached('SHIPPED', '2026-03-12T12:00:00Z'),
      reached('CUSTOMS', '2026-03-15T12:00:00Z'),
      reached('AGENCY', '2026-03-18T12:00:00Z'),
      reached('DELIVERED', '2026-03-20T12:00:00Z'),
    ]);

    expect(steps.every((step) => step.state === 'done')).toBe(true);
    expect(steps.at(-1)?.date).toBe('20 mar 2026');
  });

  it('keeps a skipped step done without a date', () => {
    const steps = buildShipmentTimeline('AGENCY', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
      reached('SHIPPED', '2026-03-12T12:00:00Z'),
      reached('AGENCY', '2026-03-18T12:00:00Z'),
    ]);

    expect(steps.map((step) => step.state)).toEqual(['done', 'done', 'done', 'current', 'pending']);
    expect(steps[2]?.date).toBeUndefined();
  });

  it('trusts the status over a timeline entry that is ahead of it', () => {
    const steps = buildShipmentTimeline('SHIPPED', [
      reached('WAREHOUSE', '2026-03-10T12:00:00Z'),
      reached('SHIPPED', '2026-03-12T12:00:00Z'),
      reached('CUSTOMS', '2026-03-15T12:00:00Z'),
    ]);

    expect(steps.map((step) => step.state)).toEqual([
      'done',
      'current',
      'pending',
      'pending',
      'pending',
    ]);
    expect(steps[2]?.date).toBeUndefined();
  });

  it('shows no date for an unparseable timestamp', () => {
    const steps = buildShipmentTimeline('WAREHOUSE', [reached('WAREHOUSE', 'not-a-date')]);

    expect(steps[0]?.date).toBeUndefined();
  });
});
