import { Box, Flex, Stack, Table, Text } from '@chakra-ui/react';
import type { PackageListItem } from '@rapiexpress/api-client/packages.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Link } from 'react-router';

import { formatDate, formatUsd, formatWeightKg, formatWeightLb } from '@/shared/lib/format';
import { packagePath } from '@/shared/model/paths';

import OpenIncidentFlag from './OpenIncidentFlag';
import PackageStatusBadge from './PackageStatusBadge';

interface PackagesListProps {
  packages: PackageListItem[];
}

const NO_DECLARED_VALUE = 'Sin valor declarado';

function CustomerLines({ customer }: { customer: PackageListItem['customer'] }) {
  if (!customer) return <Text color="slate.600">Sin asignar</Text>;
  return (
    <>
      <Text color="slate.900">{`${customer.name} ${customer.lastName}`}</Text>
      <Text fontFamily="mono" fontSize="xs" color="slate.600">
        {customer.lockerCode ?? 'Sin casillero'}
      </Text>
    </>
  );
}

function PackagesTable({ packages }: PackagesListProps) {
  return (
    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
      <Table.Root
        size="md"
        aria-label="Paquetes"
        css={{ '& th, & td': { borderColor: 'slate.200' } }}
      >
        <Table.Header>
          <Table.Row bg="transparent">
            <Table.ColumnHeader ps={5} fontWeight="medium" color="slate.600">
              Bodega
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Guía
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Cliente
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Estado
            </Table.ColumnHeader>
            <Table.ColumnHeader fontWeight="medium" color="slate.600">
              Incidencia
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" fontWeight="medium" color="slate.600">
              Peso
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end" fontWeight="medium" color="slate.600">
              Valor declarado
            </Table.ColumnHeader>
            <Table.ColumnHeader pe={5} fontWeight="medium" color="slate.600">
              Recibido
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {packages.map((item) => (
            <Table.Row key={item.id} bg="transparent" _hover={{ bg: 'slate.50' }}>
              <Table.Cell ps={5} whiteSpace="nowrap">
                <Flex
                  asChild
                  display="inline-flex"
                  align="center"
                  minH={10}
                  fontWeight="semibold"
                  fontVariantNumeric="tabular-nums"
                  color="brand.700"
                  borderRadius="md"
                  touchAction="manipulation"
                  _hover={{ textDecoration: 'underline' }}
                  _focusVisible={focusRing}
                >
                  <Link to={packagePath(item.id)}>{item.warehouseNumber}</Link>
                </Flex>
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums" color="slate.700" whiteSpace="nowrap">
                {item.trackingNumber}
              </Table.Cell>
              <Table.Cell>
                <CustomerLines customer={item.customer} />
              </Table.Cell>
              <Table.Cell>
                <PackageStatusBadge status={item.status} />
              </Table.Cell>
              <Table.Cell>{item.hasOpenIncident && <OpenIncidentFlag />}</Table.Cell>
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
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {item.declaredValueUsd === null
                  ? NO_DECLARED_VALUE
                  : formatUsd(item.declaredValueUsd)}
              </Table.Cell>
              <Table.Cell
                pe={5}
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatDate(item.createdAt)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function PackagesCards({ packages }: PackagesListProps) {
  return (
    <Stack
      as="ul"
      role="list"
      aria-label="Paquetes"
      display={{ base: 'flex', md: 'none' }}
      gap={0}
      listStyleType="none"
    >
      {packages.map((item) => (
        <Box
          as="li"
          key={item.id}
          position="relative"
          px={4}
          py={3.5}
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
          <Flex align="center" justify="space-between" gap={3}>
            <Flex
              asChild
              align="center"
              minW={0}
              fontWeight="semibold"
              fontVariantNumeric="tabular-nums"
              color="brand.700"
              outline="none"
              css={{ '&::after': { content: '""', position: 'absolute', inset: 0 } }}
            >
              <Link to={packagePath(item.id)}>{item.warehouseNumber}</Link>
            </Flex>
            <PackageStatusBadge status={item.status} />
          </Flex>
          <Text mt={1} fontSize="sm" color="slate.700" fontVariantNumeric="tabular-nums">
            Guía {item.trackingNumber}
          </Text>
          <Box mt={1.5} fontSize="sm">
            <CustomerLines customer={item.customer} />
          </Box>
          {item.hasOpenIncident && (
            <Box mt={2}>
              <OpenIncidentFlag />
            </Box>
          )}
          <Text mt={2} fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
            {formatWeightLb(item.weightLb)} ·{' '}
            {item.declaredValueUsd === null ? NO_DECLARED_VALUE : formatUsd(item.declaredValueUsd)}{' '}
            · Recibido {formatDate(item.createdAt)}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}

function PackagesList({ packages }: PackagesListProps) {
  return (
    <Box borderRadius="lg" borderWidth="1px" borderColor="slate.200" bg="white" overflow="hidden">
      <PackagesTable packages={packages} />
      <PackagesCards packages={packages} />
    </Box>
  );
}

export default PackagesList;
