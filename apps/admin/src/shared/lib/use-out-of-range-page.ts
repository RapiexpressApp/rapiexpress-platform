import { useEffect } from 'react';

import type { useListParams } from './use-list-params';

type ListParams = ReturnType<typeof useListParams>;

interface PagedResult {
  data: { items: readonly unknown[]; total: number } | undefined;
  isPlaceholderData: boolean;
}

export function useOutOfRangePage(
  { page, pageSize, update }: Pick<ListParams, 'page' | 'pageSize' | 'update'>,
  { data, isPlaceholderData }: PagedResult
): boolean {
  const lastPage = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const outOfRange =
    data !== undefined && !isPlaceholderData && data.items.length === 0 && page > lastPage;

  useEffect(() => {
    if (outOfRange) update({ page: lastPage > 1 ? String(lastPage) : null }, { replace: true });
  }, [outOfRange, lastPage, update]);

  return outOfRange;
}
