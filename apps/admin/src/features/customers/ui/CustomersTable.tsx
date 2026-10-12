import { Badge, Table } from '@chakra-ui/react';
import type { CustomerListItem } from '@rapiexpress/api-client/customers.schemas';

import { formatDate } from '@/shared/lib/format';

interface CustomersTableProps {
  customers: CustomerListItem[];
}

function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <Table.ScrollArea borderWidth="1px" borderColor="slate.200" borderRadius="lg" bg="white">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Nombre</Table.ColumnHeader>
            <Table.ColumnHeader>Correo</Table.ColumnHeader>
            <Table.ColumnHeader>Teléfono</Table.ColumnHeader>
            <Table.ColumnHeader>Tipo</Table.ColumnHeader>
            <Table.ColumnHeader>Casillero</Table.ColumnHeader>
            <Table.ColumnHeader>Estado</Table.ColumnHeader>
            <Table.ColumnHeader>Creado</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {customers.map((customer) => (
            <Table.Row key={customer.id}>
              <Table.Cell fontWeight="medium">{`${customer.name} ${customer.lastName}`}</Table.Cell>
              <Table.Cell>{customer.email}</Table.Cell>
              <Table.Cell>{customer.phone}</Table.Cell>
              <Table.Cell>{customer.kind === 'CUSTOMER' ? 'Cliente' : 'Repartidor'}</Table.Cell>
              <Table.Cell fontFamily="mono" whiteSpace="nowrap">
                {customer.lockerCode ?? 'Sin casillero'}
              </Table.Cell>
              <Table.Cell>
                <Badge colorPalette={customer.isActive ? 'green' : 'gray'} variant="subtle">
                  {customer.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatDate(customer.createdAt)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

export default CustomersTable;
