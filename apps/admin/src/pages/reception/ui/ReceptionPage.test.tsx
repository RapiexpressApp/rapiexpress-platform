import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  existingPackageFixture,
  lookupHandler,
  receptionLookupFixture,
  receptionMatchFixture,
  TRACKING_NUMBER,
} from '@/test/reception-handlers';
import { getGuideInput, renderReceptionPage, scanGuide } from '@/test/reception-page';

describe('ReceptionPage scan step', () => {
  it('starts on the scan step with the guide input focused', () => {
    renderReceptionPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Recepción' })).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 4 · Escanear guía')).toBeInTheDocument();
    expect(getGuideInput()).toHaveFocus();
    expect(document.title).toBe('Recepción · Rapiexpress');
  });

  it('looks the guide up when the scanner presses Enter', async () => {
    const requests: URL[] = [];
    renderReceptionPage(lookupHandler(receptionLookupFixture(), (url) => requests.push(url)));

    await scanGuide('1z999-aa1 0123456784');

    await screen.findByText('Paso 2 de 4 · Destino del bulto');
    expect(requests).toHaveLength(1);
    expect(requests[0]?.searchParams.get('trackingNumber')).toBe(TRACKING_NUMBER);
  });

  it('sends no request for an invalid guide and explains why', async () => {
    const requests: URL[] = [];
    renderReceptionPage(lookupHandler(receptionLookupFixture(), (url) => requests.push(url)));

    await scanGuide('AB-12');

    expect(screen.getByText('La guía debe tener entre 6 y 64 letras o números.')).toBeVisible();
    expect(requests).toHaveLength(0);
    expect(screen.getByText('Paso 1 de 4 · Escanear guía')).toBeInTheDocument();
  });

  it('shows a pending state and a single request while the lookup runs', async () => {
    const requests: URL[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderReceptionPage(
      http.get('*/api/packages/reception/lookup', async ({ request }) => {
        requests.push(new URL(request.url));
        await gate;
        return HttpResponse.json(receptionLookupFixture());
      })
    );

    await scanGuide(TRACKING_NUMBER);
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('button', { name: /Buscando/ })).toBeDisabled();
    expect(requests).toHaveLength(1);
    release();
    await screen.findByText('Paso 2 de 4 · Destino del bulto');
  });

  it('sends one request when the scanner submits twice before the page re-renders', async () => {
    const requests: URL[] = [];
    renderReceptionPage(lookupHandler(receptionLookupFixture(), (url) => requests.push(url)));
    await userEvent.type(getGuideInput(), TRACKING_NUMBER);
    const form = getGuideInput().closest('form')!;

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await screen.findByText('Paso 2 de 4 · Destino del bulto');
    expect(requests).toHaveLength(1);
  });

  it('shows an error with a working retry when the lookup fails', async () => {
    let calls = 0;
    renderReceptionPage(
      http.get('*/api/packages/reception/lookup', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(receptionLookupFixture({ matches: [receptionMatchFixture()] }));
      })
    );

    await scanGuide(TRACKING_NUMBER);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos consultar la guía.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Compra encontrada')).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});

describe('ReceptionPage duplicate warning', () => {
  const duplicate = receptionLookupFixture({
    existingPackages: [existingPackageFixture()],
    matches: [receptionMatchFixture()],
  });

  it('warns before anything else and lists the stored packages', async () => {
    renderReceptionPage(lookupHandler(duplicate));

    await scanGuide(TRACKING_NUMBER);

    expect(
      await screen.findByRole('heading', { name: 'Esta guía ya fue recibida' })
    ).toBeInTheDocument();
    expect(screen.getByText('WH-000041')).toBeInTheDocument();
    expect(screen.getByText('Embarcado')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Peso \(lb\)/ })).toBeNull();
    expect(screen.getByText('Paso 2 de 4 · Destino del bulto')).toBeInTheDocument();
  });

  it('continues to the details only after the explicit confirmation', async () => {
    renderReceptionPage(lookupHandler(duplicate));
    await scanGuide(TRACKING_NUMBER);

    await userEvent.click(await screen.findByRole('button', { name: 'Es otro bulto' }));

    expect(await screen.findByRole('textbox', { name: /Peso \(lb\)/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Esta guía ya fue recibida' })).toBeNull();
  });

  it('goes back to scanning when the operator does not confirm', async () => {
    renderReceptionPage(lookupHandler(duplicate));
    await scanGuide(TRACKING_NUMBER);

    await userEvent.click(await screen.findByRole('button', { name: 'Escanear otra guía' }));

    await waitFor(() => expect(getGuideInput()).toHaveFocus());
    expect(getGuideInput()).toHaveValue('');
    expect(screen.getByText('Paso 1 de 4 · Escanear guía')).toBeInTheDocument();
  });
});
