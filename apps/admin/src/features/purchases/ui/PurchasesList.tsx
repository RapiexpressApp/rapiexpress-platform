import { Box, Flex, Stack, Table, Text } from '@chakra-ui/react';
import type { StaffPurchase } from '@rapiexpress/api-client/purchases.schemas';

import { formatDate, formatUsd, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL } from '@/shared/model/package-labels';

import PurchaseStatusBadge from './PurchaseStatusBadge';

interface PurchasesListProps {
  purchases: StaffPurchase[];
}

function CustomerLines({ customer }: { customer: StaffPurchase['customer'] }) {
  return (
    <>
      <Text color="slate.900">{`${customer.name} ${customer.lastName}`}</Text>
      <Text fontFamily="mono" fontSize="xs" color="slate.600">
        {customer.lockerCode ?? 'Sin casillero'}
      </Text>
    </>
  );
}

const NUMERIC = { fontVariantNumeric: 'tabular-nums', color: 'slate.700', whiteSpace: 'nowrap' };

function PurchasesTable({ purchases }: PurchasesListProps) {
  return (
    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
      <Table.Root
        size="md"
        aria-label="Pre-alertas"
        css={{ '& th, & td': { borderColor: 'slate.200' } }}
      >
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader ps={5} fontWeight="medium" color="slate.600">
              Tienda
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Guía
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Cliente
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Descripción
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" fontWeight="medium" color="slate.600">
              Valor declarado
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" fontWeight="medium" color="slate.600">
              Peso estimado
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Categoría
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Estado
            </Table.ColumnHeader>
            <Table.ColumnHeader pe={5} fontWeight="medium" color="slate.600">
              Creada
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {purchases.map((purchase) => (
            <Table.Row key={purchase.id} bg="transparent" _hover={{ bg: 'slate.50' }}>
              <Table.Cell ps={5} fontWeight="semibold" color="slate.900">
                {purchase.store}
              </Table.Cell>
              <Table.Cell
                maxW="12rem"
                color="slate.700"
                fontVariantNumeric="tabular-nums"
                overflowWrap="anywhere"
              >
                {purchase.trackingNumber}
              </Table.Cell>
              <Table.Cell minW="9rem">
                <CustomerLines customer={purchase.customer} />
              </Table.Cell>
              <Table.Cell minW="14rem" maxW="22rem" color="slate.700" overflowWrap="anywhere">
                {purchase.description}
              </Table.Cell>
              <Table.Cell textAlign="end" {...NUMERIC}>
                {formatUsd(purchase.declaredValueUsd)}
              </Table.Cell>
              <Table.Cell textAlign="end" {...NUMERIC}>
                {formatWeightLb(purchase.estimatedWeightLb)}
              </Table.Cell>
              <Table.Cell color="slate.700" whiteSpace="nowrap">
                {CATEGORY_LABEL[purchase.suggestedCategory]}
              </Table.Cell>
              <Table.Cell>
                <PurchaseStatusBadge status={purchase.status} />
              </Table.Cell>
              <Table.Cell pe={5} {...NUMERIC}>
                {formatDate(purchase.createdAt)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function PurchasesCards({ purchases }: PurchasesListProps) {
  return (
    <Stack
      as="ul"
      role="list"
      aria-label="Pre-alertas"
      display={{ base: 'flex', md: 'none' }}
      gap={0}
      listStyleType="none"
    >
      {purchases.map((purchase) => (
        <Box
          as="li"
          key={purchase.id}
          px={4}
          py={3.5}
          borderTopWidth="1px"
          borderColor="slate.200"
          _first={{ borderTopWidth: 0 }}
        >
          <Flex align="center" justify="space-between" gap={3}>
            <Text fontWeight="semibold" color="slate.900" minW={0} overflowWrap="anywhere">
              {purchase.store}
            </Text>
            <PurchaseStatusBadge status={purchase.status} />
          </Flex>
          <Text
            mt={1}
            fontSize="sm"
            color="slate.700"
            fontVariantNumeric="tabular-nums"
            overflowWrap="anywhere"
          >
            Guía {purchase.trackingNumber}
          </Text>
          <Box mt={1.5} fontSize="sm">
            <CustomerLines customer={purchase.customer} />
          </Box>
          <Text mt={2} fontSize="sm" color="slate.700" overflowWrap="anywhere">
            {purchase.description}
          </Text>
          <Text mt={2} fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
            {`${formatUsd(purchase.declaredValueUsd)} · ${formatWeightLb(purchase.estimatedWeightLb)} · ${CATEGORY_LABEL[purchase.suggestedCategory]} · Creada ${formatDate(purchase.createdAt)}`}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}

function PurchasesList({ purchases }: PurchasesListProps) {
  return (
    <Box borderRadius="lg" borderWidth="1px" borderColor="slate.200" bg="white" overflow="hidden">
      <PurchasesTable purchases={purchases} />
      <PurchasesCards purchases={purchases} />
    </Box>
  );
}

export default PurchasesList;
