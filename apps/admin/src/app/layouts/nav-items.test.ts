import { describe, expect, it } from 'vitest';

import { getNavItems } from './nav-items';

describe('getNavItems', () => {
  it('gives admins reception, users and customers', () => {
    expect(getNavItems('ADMIN').map((item) => item.label)).toEqual([
      'Recepción',
      'Usuarios',
      'Clientes',
    ]);
  });

  it('gives operations reception and customers', () => {
    expect(getNavItems('OPERATIONS').map((item) => item.label)).toEqual(['Recepción', 'Clientes']);
  });

  it('gives warehouse staff only reception', () => {
    expect(getNavItems('WAREHOUSE').map((item) => item.label)).toEqual(['Recepción']);
  });

  it('points reception to its own page', () => {
    expect(getNavItems('WAREHOUSE')[0]?.to).toBe('/recepcion');
  });
});
