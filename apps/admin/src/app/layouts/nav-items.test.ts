import { describe, expect, it } from 'vitest';

import { getNavItems } from './nav-items';

describe('getNavItems', () => {
  it('gives admins reception, packages, users and customers', () => {
    expect(getNavItems('ADMIN').map((item) => item.label)).toEqual([
      'Recepción',
      'Paquetes',
      'Usuarios',
      'Clientes',
    ]);
  });

  it('gives operations reception, packages and customers', () => {
    expect(getNavItems('OPERATIONS').map((item) => item.label)).toEqual([
      'Recepción',
      'Paquetes',
      'Clientes',
    ]);
  });

  it('gives warehouse staff reception and packages only', () => {
    expect(getNavItems('WAREHOUSE').map((item) => item.label)).toEqual(['Recepción', 'Paquetes']);
  });

  it('points reception and packages to their own pages', () => {
    const targets = Object.fromEntries(
      getNavItems('WAREHOUSE').map((item) => [item.label, item.to])
    );

    expect(targets).toEqual({ Recepción: '/recepcion', Paquetes: '/paquetes' });
  });
});
