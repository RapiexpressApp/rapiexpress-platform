import { describe, expect, it } from 'vitest';

import { getNavItems } from './nav-items';

describe('getNavItems', () => {
  it('gives admins reception, packages, pre-alerts, users and customers', () => {
    expect(getNavItems('ADMIN').map((item) => item.label)).toEqual([
      'Recepción',
      'Paquetes',
      'Pre-alertas',
      'Usuarios',
      'Clientes',
    ]);
  });

  it('gives operations reception, packages, pre-alerts and customers', () => {
    expect(getNavItems('OPERATIONS').map((item) => item.label)).toEqual([
      'Recepción',
      'Paquetes',
      'Pre-alertas',
      'Clientes',
    ]);
  });

  it('keeps pre-alerts away from warehouse staff', () => {
    expect(getNavItems('WAREHOUSE').map((item) => item.label)).not.toContain('Pre-alertas');
  });

  it('gives warehouse staff reception and packages only', () => {
    expect(getNavItems('WAREHOUSE').map((item) => item.label)).toEqual(['Recepción', 'Paquetes']);
  });

  it('points pre-alerts to their own page', () => {
    const targets = Object.fromEntries(getNavItems('ADMIN').map((item) => [item.label, item.to]));

    expect(targets['Pre-alertas']).toBe('/prealertas');
  });

  it('points reception and packages to their own pages', () => {
    const targets = Object.fromEntries(
      getNavItems('WAREHOUSE').map((item) => [item.label, item.to])
    );

    expect(targets).toEqual({ Recepción: '/recepcion', Paquetes: '/paquetes' });
  });
});
