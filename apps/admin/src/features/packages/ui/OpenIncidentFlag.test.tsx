import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import OpenIncidentFlag from './OpenIncidentFlag';

describe('OpenIncidentFlag', () => {
  it('says that an incident is open with text, not only color', () => {
    renderWithProviders(<OpenIncidentFlag />, { withSession: false });

    expect(screen.getByText('Incidencia abierta')).toBeInTheDocument();
  });
});
