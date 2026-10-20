import ListPagination from '@rapiexpress/ui/list-pagination';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

describe('ListPagination', () => {
  it('shows the visible range and the current page', () => {
    renderWithProviders(
      <ListPagination page={2} pageSize={20} total={45} itemCount={20} onPageChange={vi.fn()} />,
      { withSession: false }
    );

    expect(screen.getByText('Mostrando 21–40 de 45')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('reports an empty range as zero of zero', () => {
    renderWithProviders(
      <ListPagination page={1} pageSize={20} total={0} itemCount={0} onPageChange={vi.fn()} />,
      { withSession: false }
    );

    expect(screen.getByText('Mostrando 0–0 de 0')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
  });

  it('disables the previous button on the first page and requests the next one', async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <ListPagination
        page={1}
        pageSize={20}
        total={45}
        itemCount={20}
        onPageChange={onPageChange}
      />,
      { withSession: false }
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables the next button on the last page and requests the previous one', async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <ListPagination
        page={3}
        pageSize={20}
        total={45}
        itemCount={5}
        onPageChange={onPageChange}
      />,
      { withSession: false }
    );

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe('ListStatus', () => {
  const baseProps = {
    isPending: false,
    isError: false,
    isEmpty: false,
    errorMessage: 'No pudimos cargar.',
    emptyMessage: 'Sin resultados.',
    onRetry: vi.fn(),
  };

  it('shows a loading skeleton while pending', () => {
    renderWithProviders(
      <ListStatus {...baseProps} isPending>
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    expect(screen.queryByText('contenido')).not.toBeInTheDocument();
  });

  it('shows the error and retries on demand', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ListStatus {...baseProps} isError onRetry={onRetry}>
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the empty message when there is nothing to list', () => {
    renderWithProviders(
      <ListStatus {...baseProps} isEmpty>
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    expect(screen.getByText('Sin resultados.')).toBeInTheDocument();
    expect(screen.queryByText('contenido')).not.toBeInTheDocument();
  });

  it('offers the empty action next to the empty message', async () => {
    const onCreate = vi.fn();
    renderWithProviders(
      <ListStatus
        {...baseProps}
        isEmpty
        emptyAction={<button onClick={onCreate}>Crear la primera</button>}
      >
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Crear la primera' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('does not render the empty action while there is data', () => {
    renderWithProviders(
      <ListStatus {...baseProps} emptyAction={<button>Crear la primera</button>}>
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    expect(screen.queryByRole('button', { name: 'Crear la primera' })).not.toBeInTheDocument();
  });

  it('renders the children once data is available', () => {
    renderWithProviders(
      <ListStatus {...baseProps}>
        <p>contenido</p>
      </ListStatus>,
      { withSession: false }
    );

    expect(screen.getByText('contenido')).toBeInTheDocument();
  });
});

describe('ListSearchInput', () => {
  it('debounces typing into a single search callback', async () => {
    const onSearch = vi.fn();
    renderWithProviders(
      <ListSearchInput label="Buscar" placeholder="Buscar" value="" onSearch={onSearch} />,
      { withSession: false }
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'MI-001');

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(onSearch).toHaveBeenCalledWith('MI-001');
  });

  it('does not call back when the draft matches the current value', async () => {
    const onSearch = vi.fn();
    renderWithProviders(
      <ListSearchInput label="Buscar" placeholder="Buscar" value="MI-001" onSearch={onSearch} />,
      { withSession: false }
    );

    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('MI-001');
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
