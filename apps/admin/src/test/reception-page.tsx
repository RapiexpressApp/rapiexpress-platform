import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RequestHandler } from 'msw';
import { Route, Routes } from 'react-router';

import ReceptionPage from '@/pages/reception/ui/ReceptionPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderReceptionPage(...handlers: RequestHandler[]) {
  server.use(refreshOkHandler(), meHandler('WAREHOUSE'), ...handlers);
  return renderWithProviders(
    <Routes>
      <Route path="/recepcion" element={<ReceptionPage />} />
    </Routes>,
    { route: '/recepcion' }
  );
}

export function getGuideInput() {
  return screen.getByRole('textbox', { name: 'Guía de seguimiento' });
}

export async function scanGuide(guide: string) {
  await userEvent.type(getGuideInput(), `${guide}{Enter}`);
}

export async function enterWeight(weight: string) {
  await userEvent.type(await screen.findByRole('textbox', { name: /Peso \(lb\)/ }), weight);
}

export async function reviewReception() {
  await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));
}

export async function confirmReception() {
  await userEvent.click(await screen.findByRole('button', { name: 'Confirmar recepción' }));
}
