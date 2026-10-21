import { Flex, Heading, Stack } from '@chakra-ui/react';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { useEffect } from 'react';

import { useUsers } from '@/features/users/model/use-users';
import { LOAD_USERS_FAILED_MESSAGE } from '@/features/users/model/user-errors';
import CreateUserDialog from '@/features/users/ui/CreateUserDialog';
import UsersTable from '@/features/users/ui/UsersTable';
import { useListParams } from '@/shared/lib/use-list-params';

function UsersPage() {
  const { page, pageSize, search, setSearch, setPage } = useListParams();
  const users = useUsers({ page, pageSize, search });

  useEffect(() => {
    document.title = 'Usuarios · Rapiexpress';
  }, []);

  const items = users.data?.items ?? [];

  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between" gap={4} wrap="wrap">
        <Heading as="h1" size="xl" color="slate.900">
          Usuarios
        </Heading>
        <CreateUserDialog />
      </Flex>

      <ListSearchInput
        label="Buscar usuarios"
        placeholder="Buscar por nombre o correo"
        value={search}
        onSearch={setSearch}
      />

      <ListStatus
        isPending={users.isPending}
        isError={users.isError}
        isEmpty={items.length === 0}
        errorMessage={LOAD_USERS_FAILED_MESSAGE}
        emptyMessage={search ? 'No encontramos usuarios con esa búsqueda.' : 'Aún no hay usuarios.'}
        onRetry={() => void users.refetch()}
      >
        <Stack gap={4}>
          <UsersTable users={items} />
          {users.data && (
            <ListPagination
              page={users.data.page}
              pageSize={users.data.pageSize}
              total={users.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>
    </Stack>
  );
}

export default UsersPage;
