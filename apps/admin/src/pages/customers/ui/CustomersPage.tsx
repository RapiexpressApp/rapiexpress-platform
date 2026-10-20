import { Heading, Stack } from '@chakra-ui/react';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { useEffect } from 'react';

import { useCustomers } from '@/features/customers/model/use-customers';
import CustomersTable from '@/features/customers/ui/CustomersTable';
import { useListParams } from '@/shared/lib/use-list-params';

function CustomersPage() {
  const { page, pageSize, search, setSearch, setPage } = useListParams();
  const customers = useCustomers({ page, pageSize, search });

  useEffect(() => {
    document.title = 'Clientes · Rapiexpress';
  }, []);

  const items = customers.data?.items ?? [];

  return (
    <Stack gap={6}>
      <Heading as="h1" size="xl" color="slate.900">
        Clientes
      </Heading>

      <ListSearchInput
        label="Buscar clientes"
        placeholder="Buscar por nombre, correo o casillero"
        value={search}
        onSearch={setSearch}
      />

      <ListStatus
        isPending={customers.isPending}
        isError={customers.isError}
        isEmpty={items.length === 0}
        errorMessage="No pudimos cargar los clientes."
        emptyMessage={search ? 'No encontramos clientes con esa búsqueda.' : 'Aún no hay clientes.'}
        onRetry={() => void customers.refetch()}
      >
        <Stack gap={4}>
          <CustomersTable customers={items} />
          {customers.data && (
            <ListPagination
              page={customers.data.page}
              pageSize={customers.data.pageSize}
              total={customers.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>
    </Stack>
  );
}

export default CustomersPage;
