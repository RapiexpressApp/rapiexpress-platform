import { Box, Button, Flex, Stack, Table, Text } from '@chakra-ui/react';
import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';

import { formatDate, formatUsd, formatWeightLb } from '@/shared/lib/format';

import { CATEGORY_LABEL } from '../model/purchase-labels';
import PurchaseStatusIndicator from './PurchaseStatusIndicator';

interface PurchasesListProps {
  purchases: Purchase[];
  onEdit: (purchase: Purchase) => void;
  onCancel: (purchase: Purchase) => void;
}

function PurchaseActions({
  purchase,
  onEdit,
  onCancel,
}: Pick<PurchasesListProps, 'onEdit' | 'onCancel'> & { purchase: Purchase }) {
  if (purchase.status !== 'PENDING_RECEPTION') return null;

  return (
    <Flex gap={2}>
      <Button
        variant="outline"
        aria-label={`Editar pre-alerta ${purchase.trackingNumber}`}
        minH={11}
        px={4}
        fontSize="sm"
        fontWeight="medium"
        borderRadius="lg"
        borderColor="slate.300"
        color="slate.700"
        touchAction="manipulation"
        _hover={{ bg: 'slate.50' }}
        _focusVisible={focusRing}
        onClick={() => onEdit(purchase)}
      >
        Editar
      </Button>
      <Button
        variant="outline"
        aria-label={`Cancelar pre-alerta ${purchase.trackingNumber}`}
        minH={11}
        px={4}
        fontSize="sm"
        fontWeight="medium"
        borderRadius="lg"
        borderColor="slate.300"
        color="red.600"
        touchAction="manipulation"
        _hover={{ bg: 'slate.50' }}
        _focusVisible={focusRing}
        onClick={() => onCancel(purchase)}
      >
        Cancelar
      </Button>
    </Flex>
  );
}

function PurchasesTable({ purchases, onEdit, onCancel }: PurchasesListProps) {
  return (
    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
      <Table.Root
        size="md"
        aria-label="Pre-alertas"
        css={{ '& th, & td': { borderColor: 'slate.200' } }}
      >
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader ps={6} fontWeight="medium" color="slate.600">
              Tienda
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Guía
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
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Creada
            </Table.ColumnHeader>
            <Table.ColumnHeader pe={6} fontWeight="medium" color="slate.600">
              Acciones
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {purchases.map((purchase) => (
            <Table.Row key={purchase.id} bg="transparent" _hover={{ bg: 'slate.50' }}>
              <Table.Cell ps={6} py={3.5} maxW="xs">
                <Text fontWeight="medium" color="slate.900">
                  {purchase.store}
                </Text>
                <Text fontSize="sm" color="slate.600" lineClamp={2}>
                  {purchase.description}
                </Text>
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums" color="slate.700" whiteSpace="nowrap">
                {purchase.trackingNumber}
              </Table.Cell>
              <Table.Cell
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatUsd(purchase.declaredValueUsd)}
              </Table.Cell>
              <Table.Cell
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatWeightLb(purchase.estimatedWeightLb)}
              </Table.Cell>
              <Table.Cell color="slate.700" whiteSpace="nowrap">
                {CATEGORY_LABEL[purchase.suggestedCategory]}
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">
                <PurchaseStatusIndicator status={purchase.status} />
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums" color="slate.700" whiteSpace="nowrap">
                {formatDate(purchase.createdAt)}
              </Table.Cell>
              <Table.Cell pe={6}>
                <PurchaseActions purchase={purchase} onEdit={onEdit} onCancel={onCancel} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function PurchasesCards({ purchases, onEdit, onCancel }: PurchasesListProps) {
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
          px={5}
          py={4}
          borderTopWidth="1px"
          borderColor="slate.200"
          _first={{ borderTopWidth: 0 }}
        >
          <Text fontWeight="medium" color="slate.900">
            {purchase.store}
          </Text>
          <Text fontSize="sm" color="slate.600" lineClamp={2}>
            {purchase.description}
          </Text>
          <Text mt={2} fontSize="sm" color="slate.700" fontVariantNumeric="tabular-nums">
            Guía {purchase.trackingNumber}
          </Text>
          <Text fontSize="sm" color="slate.700" fontVariantNumeric="tabular-nums">
            {formatUsd(purchase.declaredValueUsd)} · {formatWeightLb(purchase.estimatedWeightLb)} ·{' '}
            {CATEGORY_LABEL[purchase.suggestedCategory]}
          </Text>
          <Box mt={2.5} display="flex" flexWrap="wrap" justifyContent="space-between" columnGap={4}>
            <PurchaseStatusIndicator status={purchase.status} />
            <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
              Creada {formatDate(purchase.createdAt)}
            </Text>
          </Box>
          {purchase.status === 'PENDING_RECEPTION' && (
            <Box mt={3}>
              <PurchaseActions purchase={purchase} onEdit={onEdit} onCancel={onCancel} />
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

function PurchasesList({ purchases, onEdit, onCancel }: PurchasesListProps) {
  return (
    <Box borderRadius="xl" borderWidth="1px" borderColor="slate.200" bg="white" overflow="hidden">
      <PurchasesTable purchases={purchases} onEdit={onEdit} onCancel={onCancel} />
      <PurchasesCards purchases={purchases} onEdit={onEdit} onCancel={onCancel} />
    </Box>
  );
}

export default PurchasesList;
