import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { customerSummaryFixture, packageDetailFixture } from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import ReceptionSuccess from './ReceptionSuccess';

function renderSuccess(received = packageDetailFixture()) {
  const onAnother = vi.fn();
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  renderWithProviders(<ReceptionSuccess received={received} onAnother={onAnother} />, {
    withSession: false,
  });
  return { onAnother, print, region: screen.getByRole('region', { name: 'Paquete recibido' }) };
}

const assigned = packageDetailFixture({
  warehouseNumber: 'WH-000050',
  customer: customerSummaryFixture(),
  weightLb: 3.5,
  label: { warehouseNumber: 'WH-000050', customerName: 'Jane Doe', lockerCode: 'MI-00001' },
});

describe('ReceptionSuccess', () => {
  it('announces the reception and moves focus to it', () => {
    renderSuccess();

    expect(screen.getByRole('heading', { name: 'Paquete recibido' })).toHaveFocus();
  });

  it('shows the warehouse number prominently', () => {
    const { region } = renderSuccess(assigned);

    expect(within(region).getByText('WH-000050')).toBeVisible();
  });

  it('says who the package was assigned to, with the weight and type', () => {
    const { region } = renderSuccess(assigned);

    expect(within(region).getByText('Asignado a Jane Doe · MI-00001')).toBeInTheDocument();
    expect(within(region).getByText('3,5 lb · Normal')).toBeInTheDocument();
  });

  it('says plainly that an unassigned package goes to the unassigned tray', () => {
    const { region } = renderSuccess();

    expect(
      within(region).getByText('Sin asignar: irá a la bandeja de no asignados.')
    ).toBeInTheDocument();
  });

  it('prints the label with the browser print dialog', async () => {
    const { print } = renderSuccess(assigned);

    await userEvent.click(screen.getByRole('button', { name: 'Imprimir etiqueta' }));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it('renders the label that gets printed with the warehouse number, customer and locker', () => {
    renderSuccess(assigned);

    const label = screen.getByLabelText('Etiqueta de bodega');
    expect(label).toHaveTextContent('WH-000050');
    expect(label).toHaveTextContent('Jane Doe');
    expect(label).toHaveTextContent('MI-00001');
  });

  it('starts the next reception', async () => {
    const { onAnother } = renderSuccess();

    await userEvent.click(screen.getByRole('button', { name: 'Recibir otro' }));

    expect(onAnother).toHaveBeenCalledTimes(1);
  });
});
