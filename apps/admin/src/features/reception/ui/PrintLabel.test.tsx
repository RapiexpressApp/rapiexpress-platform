import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import PrintLabel from './PrintLabel';

interface Rule {
  selector: string;
  display: string;
  important: boolean;
}

function readRules() {
  const onScreen: Rule[] = [];
  const inPrint: Rule[] = [];
  const read = (rule: CSSStyleRule): Rule => ({
    selector: rule.selectorText,
    display: rule.style.getPropertyValue('display'),
    important: rule.style.getPropertyPriority('display') === 'important',
  });

  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSMediaRule && rule.media.mediaText === 'print') {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule) inPrint.push(read(inner));
        }
      } else if (rule instanceof CSSStyleRule) {
        onScreen.push(read(rule));
      }
    }
  }
  return { onScreen, inPrint };
}

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

  it('keeps the label off the screen and shows it alone in print', () => {
    const label = renderLabel({
      warehouseNumber: 'WH-000042',
      customerName: null,
      lockerCode: null,
    });
    const others = Array.from(document.body.children).filter((child) => child !== label);
    const { onScreen, inPrint } = readRules();
    const hideOthers = inPrint.find((rule) => rule.display === 'none');
    const showLabel = inPrint.find((rule) => rule.selector === `.${label.classList[0]}`);

    expect(label.parentElement).toBe(document.body);
    expect(label).toHaveAttribute('data-print-label');
    expect(getComputedStyle(label).display).toBe('none');

    expect(hideOthers).toMatchObject({ display: 'none', important: true });
    expect(others.length).toBeGreaterThan(0);
    expect(others.every((child) => child.matches(hideOthers!.selector))).toBe(true);
    expect(label.matches(hideOthers!.selector)).toBe(false);
    expect(showLabel?.display).toBe('flex');

    expect(onScreen.some((rule) => rule.selector === hideOthers!.selector)).toBe(false);
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
