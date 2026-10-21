import { describe, expect, it } from 'vitest';

import { canLinkPurchase, DEFAULT_ROUTE, isPanelRole, PANEL_ROLES } from './roles';

describe('panel roles', () => {
  it('admits admin, operations and warehouse staff to the panel', () => {
    expect(PANEL_ROLES).toEqual(['ADMIN', 'OPERATIONS', 'WAREHOUSE']);
    expect(isPanelRole('WAREHOUSE')).toBe(true);
  });

  it.each(['CUSTOMER', 'COURIER', 'warehouse', ''])('keeps %j out of the panel', (role) => {
    expect(isPanelRole(role)).toBe(false);
  });

  it('sends each role to its working page after login', () => {
    expect(DEFAULT_ROUTE).toEqual({
      ADMIN: '/usuarios',
      OPERATIONS: '/clientes',
      WAREHOUSE: '/recepcion',
    });
  });
});

describe('canLinkPurchase', () => {
  it.each(['ADMIN', 'OPERATIONS'])('lets %s list purchases to link one', (role) => {
    expect(canLinkPurchase(role)).toBe(true);
  });

  it.each(['WAREHOUSE', 'CUSTOMER', ''])('keeps %j out, since it cannot list purchases', (role) => {
    expect(canLinkPurchase(role)).toBe(false);
  });
});
