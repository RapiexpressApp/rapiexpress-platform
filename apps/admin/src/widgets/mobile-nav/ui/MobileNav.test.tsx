import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getNavItems } from '@/app/layouts/nav-items';
import { renderWithProviders } from '@/test/render';

import MobileNav from './MobileNav';

function renderNav() {
  renderWithProviders(<MobileNav items={getNavItems('ADMIN')} />, { withSession: false });
  return screen.getByRole('navigation', { name: 'Navegación móvil' });
}

describe('MobileNav', () => {
  it('lists every entry of the role as a link', () => {
    renderNav();

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Recepción',
      'Paquetes',
      'Pre-alertas',
      'Usuarios',
      'Clientes',
    ]);
  });

  it('scrolls sideways instead of widening the page when the entries do not fit', () => {
    const nav = renderNav();

    expect(nav.querySelector('ul')).toHaveStyle({ overflowX: 'auto' });
  });

  it('keeps each label on one line, so a hyphenated label does not break in two', () => {
    renderNav();

    expect(screen.getByRole('link', { name: 'Pre-alertas' })).toHaveStyle({
      whiteSpace: 'nowrap',
    });
  });
});
