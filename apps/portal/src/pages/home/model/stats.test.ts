import { describe, expect, it } from 'vitest';

import { combineStats, describeActivity, type StatState } from './stats';

const ready = (value: number): StatState => ({ status: 'ready', value });
const pending: StatState = { status: 'pending' };
const failed: StatState = { status: 'error' };

describe('combineStats', () => {
  it('adds ready values', () => {
    expect(combineStats(ready(2), ready(1))).toEqual(ready(3));
  });

  it('fails when any part failed, even if another is still pending', () => {
    expect(combineStats(ready(2), failed)).toEqual(failed);
    expect(combineStats(pending, failed)).toEqual(failed);
  });

  it('stays pending while a part is loading', () => {
    expect(combineStats(ready(2), pending)).toEqual(pending);
  });
});

describe('describeActivity', () => {
  it('says nothing is on the way or at the agency', () => {
    expect(describeActivity(ready(0), ready(0))).toBe(
      'Por ahora no tienes paquetes en camino ni en tu agencia.'
    );
  });

  it('counts packages on the way and at the agency', () => {
    expect(describeActivity(ready(3), ready(2))).toBe(
      'Tienes 3 paquetes en camino y 2 en tu agencia.'
    );
  });

  it('uses the singular', () => {
    expect(describeActivity(ready(1), ready(0))).toBe('Tienes 1 paquete en camino.');
    expect(describeActivity(ready(0), ready(1))).toBe('Tienes 1 paquete en tu agencia.');
    expect(describeActivity(ready(1), ready(1))).toBe(
      'Tienes 1 paquete en camino y 1 en tu agencia.'
    );
  });

  it('falls back to a generic line until both counts are known', () => {
    const generic = 'Aquí tienes el resumen de tus paquetes.';
    expect(describeActivity(pending, ready(2))).toBe(generic);
    expect(describeActivity(ready(2), failed)).toBe(generic);
  });
});
