import { describe, expect, it } from 'vitest';

import { getNavItems } from './nav-items';

describe('getNavItems', () => {
  it('gives admins users and customers', () => {
    expect(getNavItems('ADMIN').map((item) => item.label)).toEqual(['Usuarios', 'Clientes']);
  });

  it('gives operations only customers', () => {
    expect(getNavItems('OPERATIONS').map((item) => item.label)).toEqual(['Clientes']);
  });
});
