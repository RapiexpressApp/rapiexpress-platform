import { Button, Heading, Stack } from '@chakra-ui/react';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { useEffect } from 'react';

import { LOAD_PACKAGES_FAILED_MESSAGE } from '@/features/packages/model/package-errors';
import {
  buildPackageListParams,
  filtersToQuery,
  parsePackageFilters,
} from '@/features/packages/model/package-list-params';
import { usePackages } from '@/features/packages/model/use-packages';
import PackageFilters from '@/features/packages/ui/PackageFilters';
import PackagesList from '@/features/packages/ui/PackagesList';
import { useListParams } from '@/shared/lib/use-list-params';
import { useOutOfRangePage } from '@/shared/lib/use-out-of-range-page';
import { useSearchInputReset } from '@/shared/lib/use-search-input-reset';

const CLEARED = { status: null, unassigned: null, hasIncident: null, search: null };

function PackagesPage() {
  const { page, pageSize, search, searchParams, setSearch, setPage, update } = useListParams();
  const searchInput = useSearchInputReset(search);
  const filters = parsePackageFilters(searchParams);
  const packages = usePackages(buildPackageListParams({ page, pageSize, search }, filters));

  useEffect(() => {
    document.title = 'Paquetes · Rapiexpress';
  }, []);

  const items = packages.data?.items ?? [];
  const outOfRange = useOutOfRangePage({ page, pageSize, update }, packages);

  const isFiltered =
    search !== '' || filters.status !== null || filters.unassigned || filters.hasIncident;

  function clearFilters() {
    update(CLEARED, { resetPage: true });
    searchInput.reset();
  }

  return (
    <Stack gap={6}>
      <Heading as="h1" size="xl" color="slate.900">
        Paquetes
      </Heading>

      <Stack gap={3}>
        <ListSearchInput
          key={searchInput.key}
          label="Buscar paquetes"
          placeholder="Buscar por bodega, guía, cliente o casillero"
          value={search}
          onSearch={setSearch}
        />
        <PackageFilters
          filters={filters}
          onChange={(changes) => update(filtersToQuery(changes), { resetPage: true })}
        />
      </Stack>

      <ListStatus
        isPending={packages.isPending || outOfRange}
        isError={packages.isError}
        isEmpty={items.length === 0}
        errorMessage={LOAD_PACKAGES_FAILED_MESSAGE}
        emptyMessage={
          isFiltered
            ? 'No encontramos paquetes con estos filtros.'
            : 'Aún no hay paquetes recibidos.'
        }
        emptyAction={
          isFiltered && (
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )
        }
        onRetry={() => void packages.refetch()}
      >
        <Stack gap={4}>
          <PackagesList packages={items} />
          {packages.data && (
            <ListPagination
              page={packages.data.page}
              pageSize={packages.data.pageSize}
              total={packages.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>
    </Stack>
  );
}

export default PackagesPage;
