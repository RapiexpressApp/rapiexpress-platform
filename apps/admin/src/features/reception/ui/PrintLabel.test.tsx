import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import PrintLabel from './PrintLabel';

function renderLabel(label: React.ComponentProps<typeof PrintLabel>['label']) {
  renderWithProviders(<PrintLabel label={label} />, { withSession: false });
  return screen.getByLabelText('Etiqueta de bodega');
}

describe('PrintLabel', () => {
  it('shows the warehouse number, the customer and the locker', () => {
    const label = renderLabel({
      warehouseNumber: 'WH-000042',
      customerName: 'Jane Doe',
      lockerCode: 'MI-00001',
    });

    expect(label).toHaveTextContent('WH-000042');
    expect(label).toHaveTextContent('Jane Doe');
    expect(label).toHaveTextContent('MI-00001');
    expect(label).not.toHaveTextContent('Sin asignar');
  });

  it('keeps the warehouse number on one line however narrow the label is', () => {
    const label = renderLabel({
      warehouseNumber: 'WH-000042',
      customerName: null,
      lockerCode: null,
    });

    const number = Array.from(label.querySelectorAll('p')).find(
      (paragraph) => paragraph.textContent === 'WH-000042'
    );
    expect(number && getComputedStyle(number).whiteSpace).toBe('nowrap');
  });

  it('marks a package without a customer as unassigned', () => {
    const label = renderLabel({
      warehouseNumber: 'WH-000043',
      customerName: null,
      lockerCode: null,
    });

    expect(label).toHaveTextContent('WH-000043');
    expect(label).toHaveTextContent('Sin asignar');
  });

  it('keeps the label out of the screen and prints it alone', () => {
    const label = renderLabel({
      warehouseNumber: 'WH-000042',
      customerName: null,
      lockerCode: null,
    });
    const printCss = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    expect(label.parentElement).toBe(document.body);
    expect(label).toHaveAttribute('data-print-label');
    expect(getComputedStyle(label).display).toBe('none');
    expect(printCss).toMatch(/@media print/);
    expect(printCss).toMatch(/body>\*:not\(\[data-print-label\]\)/);
  });

  it('removes the label and the print rules when it unmounts', () => {
    const { unmount } = renderWithProviders(
      <PrintLabel label={{ warehouseNumber: 'WH-000042', customerName: null, lockerCode: null }} />,
      { withSession: false }
    );

    unmount();

    expect(document.querySelector('[data-print-label]')).toBeNull();
  });
});
