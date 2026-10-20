import { Box, Flex, Stack, Table, Text } from '@chakra-ui/react';
import type { MyPackage } from '@rapiexpress/api-client/tracking.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Link } from 'react-router';

import { formatDate, formatWeightKg, formatWeightLb } from '@/shared/lib/format';
import { shipmentPath } from '@/shared/model/paths';

import PackageStatusIndicator from './PackageStatusIndicator';
import ReadyForPickupBadge from './ReadyForPickupBadge';

interface ShipmentsListProps {
  packages: MyPackage[];
}

const NO_DESCRIPTION = 'Sin descripción';

function PackageStatus({ item }: { item: MyPackage }) {
  return (
    <Flex direction="column" align="flex-start" gap={1.5}>
      <PackageStatusIndicator status={item.status} />
      {item.readyForPickup && <ReadyForPickupBadge />}
    </Flex>
  );
}

function ShipmentsTable({ packages }: ShipmentsListProps) {
  return (
    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
      <Table.Root
        size="md"
        aria-label="Envíos"
        css={{ '& th, & td': { borderColor: 'slate.200' } }}
      >
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader ps={6} fontWeight="medium" color="slate.600">
              Paquete
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Guía
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Estado
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" fontWeight="medium" color="slate.600">
              Peso
            </Table.ColumnHeader>
            <Table.ColumnHeader pe={6} fontWeight="medium" color="slate.600">
              Recibido
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {packages.map((item) => (
            <Table.Row key={item.id} bg="transparent" _hover={{ bg: 'slate.50' }}>
              <Table.Cell ps={6} py={3.5} maxW="xs">
                <Flex
                  asChild
                  display="inline-flex"
                  align="center"
                  minH={11}
                  fontWeight="semibold"
                  fontVariantNumeric="tabular-nums"
                  color="brand.700"
                  borderRadius="md"
                  touchAction="manipulation"
                  _hover={{ textDecoration: 'underline' }}
                  _focusVisible={focusRing}
                >
                  <Link to={shipmentPath(item.id)}>{item.warehouseNumber}</Link>
                </Flex>
                <Text fontSize="sm" color="slate.600" lineClamp={2}>
                  {item.description ?? NO_DESCRIPTION}
                </Text>
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums" color="slate.700" whiteSpace="nowrap">
                {item.trackingNumber}
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">
                <PackageStatus item={item} />
              </Table.Cell>
              <Table.Cell
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatWeightLb(item.weightLb)}
                <Text fontSize="xs" color="slate.600">
                  {formatWeightKg(item.weightKg)}
                </Text>
              </Table.Cell>
              <Table.Cell
                pe={6}
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatDate(item.receivedAt)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function ShipmentsCards({ packages }: ShipmentsListProps) {
  return (
    <Stack
      as="ul"
      role="list"
      aria-label="Envíos"
      display={{ base: 'flex', md: 'none' }}
      gap={0}
      listStyleType="none"
    >
      {packages.map((item) => (
        <Box
          as="li"
          key={item.id}
          position="relative"
          px={5}
          py={4}
          borderTopWidth="1px"
          borderColor="slate.200"
          _first={{ borderTopWidth: 0 }}
          _hover={{ bg: 'slate.50' }}
          css={{
            '&:has(a:focus-visible)': {
              outline: 'none',
              boxShadow: 'inset 0 0 0 2px {colors.brand.600}',
            },
          }}
        >
          <Flex
            asChild
            align="center"
            fontWeight="semibold"
            fontVariantNumeric="tabular-nums"
            color="brand.700"
            outline="none"
            css={{ '&::after': { content: '""', position: 'absolute', inset: 0 } }}
          >
            <Link to={shipmentPath(item.id)}>{item.warehouseNumber}</Link>
          </Flex>
          <Text fontSize="sm" color="slate.600" lineClamp={2}>
            {item.description ?? NO_DESCRIPTION}
          </Text>
          <Text mt={2} fontSize="sm" color="slate.700" fontVariantNumeric="tabular-nums">
            Guía {item.trackingNumber}
          </Text>
          <Box mt={2.5}>
            <PackageStatus item={item} />
          </Box>
          <Text mt={2} fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
            {formatWeightLb(item.weightLb)} · {formatWeightKg(item.weightKg)} · Recibido{' '}
            {formatDate(item.receivedAt)}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}

function ShipmentsList({ packages }: ShipmentsListProps) {
  return (
    <Box borderRadius="xl" borderWidth="1px" borderColor="slate.200" bg="white" overflow="hidden">
      <ShipmentsTable packages={packages} />
      <ShipmentsCards packages={packages} />
    </Box>
  );
}

export default ShipmentsList;
