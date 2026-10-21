import { Button, Heading, Stack } from '@chakra-ui/react';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { useEffect } from 'react';

import { LOAD_PURCHASES_FAILED_MESSAGE } from '@/features/purchases/model/purchase-errors';
import {
  buildPurchaseListParams,
  parsePurchaseStatus,
} from '@/features/purchases/model/purchase-list-params';
import { usePurchases } from '@/features/purchases/model/use-purchases';
import PurchasesList from '@/features/purchases/ui/PurchasesList';
import PurchaseStatusFilter from '@/features/purchases/ui/PurchaseStatusFilter';
import { useListParams } from '@/shared/lib/use-list-params';
import { useOutOfRangePage } from '@/shared/lib/use-out-of-range-page';
import { useSearchInputReset } from '@/shared/lib/use-search-input-reset';

const CLEARED = { status: null, search: null };

function PurchasesPage() {
  const { page, pageSize, search, searchParams, setSearch, setPage, update } = useListParams();
  const searchInput = useSearchInputReset(search);
  const status = parsePurchaseStatus(searchParams);
  const purchases = usePurchases(buildPurchaseListParams({ page, pageSize, search }, status));

  useEffect(() => {
    document.title = 'Pre-alertas · Rapiexpress';
  }, []);

  const items = purchases.data?.items ?? [];
  const outOfRange = useOutOfRangePage({ page, pageSize, update }, purchases);
  const isFiltered = search !== '' || status !== null;

  function clearFilters() {
    update(CLEARED, { resetPage: true });
    searchInput.reset();
  }

  return (
    <Stack gap={6}>
      <Heading as="h1" size="xl" color="slate.900">
        Pre-alertas
      </Heading>

      <Stack gap={3}>
        <ListSearchInput
          key={searchInput.key}
          label="Buscar pre-alertas"
          placeholder="Buscar por guía, cliente o casillero"
          value={search}
          onSearch={setSearch}
        />
        <PurchaseStatusFilter
          value={status}
          onChange={(next) => update({ status: next }, { resetPage: true })}
        />
      </Stack>

      <ListStatus
        isPending={purchases.isPending || outOfRange}
        isError={purchases.isError}
        isEmpty={items.length === 0}
        errorMessage={LOAD_PURCHASES_FAILED_MESSAGE}
        emptyMessage={
          isFiltered ? 'No encontramos pre-alertas con estos filtros.' : 'Aún no hay pre-alertas.'
        }
        emptyAction={
          isFiltered && (
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )
        }
        onRetry={() => void purchases.refetch()}
      >
        <Stack gap={4}>
          <PurchasesList purchases={items} />
          {purchases.data && (
            <ListPagination
              page={purchases.data.page}
              pageSize={purchases.data.pageSize}
              total={purchases.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>
    </Stack>
  );
}

export default PurchasesPage;
