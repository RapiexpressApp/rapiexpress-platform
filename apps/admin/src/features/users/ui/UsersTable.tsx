import { Badge, Table } from '@chakra-ui/react';
import type { UserListItem } from '@rapiexpress/api-client/users.schemas';

import { formatDate } from '@/shared/lib/format';
import { getRoleLabel } from '@/shared/model/roles';

interface UsersTableProps {
  users: UserListItem[];
}

function UsersTable({ users }: UsersTableProps) {
  return (
    <Table.ScrollArea borderWidth="1px" borderColor="slate.200" borderRadius="lg" bg="white">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Nombre</Table.ColumnHeader>
            <Table.ColumnHeader>Correo</Table.ColumnHeader>
            <Table.ColumnHeader>Teléfono</Table.ColumnHeader>
            <Table.ColumnHeader>Rol</Table.ColumnHeader>
            <Table.ColumnHeader>Estado</Table.ColumnHeader>
            <Table.ColumnHeader>Creado</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell fontWeight="medium">{`${user.name} ${user.lastName}`}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{user.phone}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={user.role === 'ADMIN' ? 'purple' : 'blue'} variant="subtle">
                  {getRoleLabel(user.role)}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Badge colorPalette={user.isActive ? 'green' : 'gray'} variant="subtle">
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export default UsersTable;
