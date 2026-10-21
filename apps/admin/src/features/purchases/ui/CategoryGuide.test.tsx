import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import CategoryGuide from './CategoryGuide';

function renderGuide(selected: Parameters<typeof CategoryGuide>[0]['selected'] = '') {
  renderWithProviders(<CategoryGuide id="category-guide" selected={selected} />, {
    withSession: false,
  });
  return within(screen.getByRole('list'));
}

describe('CategoryGuide', () => {
  it('explains what each customs category covers', () => {
    const guide = renderGuide();

    expect(guide.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '4x4: Hasta USD 400 y 8,5 lb.',
      'G (migrante): Para uso personal.',
      'C (comercial): Hasta 100 kg y USD 5.000.',
      'Es una sugerencia: la categoría final se define al recibir el paquete en bodega.',
    ]);
  });

  it('can be referenced by the category field', () => {
    renderGuide('MIGRANT');

    expect(screen.getByRole('list')).toHaveAttribute('id', 'category-guide');
  });
});
