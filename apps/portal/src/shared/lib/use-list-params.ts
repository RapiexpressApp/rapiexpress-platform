import { useSearchParams } from 'react-router';

const PAGE_SIZE = 10;

interface UpdateOptions {
  resetPage?: boolean;
  replace?: boolean;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? value : fallback;
}

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePositiveInt(searchParams.get('page'), 1);

  function update(changes: Record<string, string | null>, options: UpdateOptions = {}) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [name, value] of Object.entries(changes)) {
          if (value === null) next.delete(name);
          else next.set(name, value);
        }
        if (options.resetPage) next.delete('page');
        return next;
      },
      { replace: options.replace }
    );
  }

  function setPage(value: number) {
    update({ page: String(value) });
  }

  return { page, pageSize: PAGE_SIZE, searchParams, setPage, update };
}
