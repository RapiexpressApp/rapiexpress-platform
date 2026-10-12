import { useSearchParams } from 'react-router';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? value : fallback;
}

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePositiveInt(searchParams.get('page'), 1);
  const pageSize = Math.min(
    parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const search = searchParams.get('search')?.trim() ?? '';

  function setSearch(value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        const term = value.trim();
        if (term) next.set('search', term);
        else next.delete('search');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }

  function setPage(value: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', String(value));
      return next;
    });
  }

  return { page, pageSize, search, setSearch, setPage };
}
