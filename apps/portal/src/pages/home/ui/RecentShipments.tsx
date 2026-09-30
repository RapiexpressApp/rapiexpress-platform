import { Box, Button, Flex, Stack, Table, Text } from '@chakra-ui/react';
import { PackageOpen, Plus } from 'lucide-react';
import { Link } from 'react-router';

import { focusRing, pressable } from '@/shared/ui/interaction';

import { formatWeight } from '../model/shipment-format';
import type { Shipment } from '../model/types';
import StatusIndicator from './StatusIndicator';

interface RecentShipmentsProps {
  shipments: Shipment[];
}

function EmptyState() {
  return (
    <Flex
      direction="column"
      align="center"
      gap={3}
      px={6}
      py={{ base: 10, md: 14 }}
      textAlign="center"
    >
      <Flex
        aria-hidden="true"
        align="center"
        justify="center"
        boxSize={12}
        borderRadius="full"
        bg="brand.50"
        color="brand.600"
      >
        <PackageOpen size={24} />
      </Flex>
      <Box>
        <Text as="h3" fontSize="md" fontWeight="semibold" color="slate.900">
          Aún no tienes envíos
        </Text>
        <Text mt={1} fontSize="sm" color="slate.600">
          Cuando pre-alertes una compra, la verás aquí.
        </Text>
      </Box>
      <Button
        asChild
        colorPalette="brand"
        mt={2}
        height={11}
        px={5}
        fontSize="sm"
        fontWeight="semibold"
        borderRadius="lg"
        css={pressable}
      >
        <Link to="/pre-alerts">
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          Pre-alertar mi primera compra
        </Link>
      </Button>
    </Flex>
  );
}

function ShipmentsTable({ shipments }: RecentShipmentsProps) {
  return (
    <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
      <Table.Root size="md" css={{ '& th, & td': { borderColor: 'slate.200' } }}>
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
              Llegada
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {shipments.map((shipment) => (
            <Table.Row key={shipment.id} bg="transparent" _hover={{ bg: 'slate.50' }}>
              <Table.Cell ps={6} py={3.5}>
                <Text fontWeight="medium" color="slate.900">
                  {shipment.name}
                </Text>
                <Text fontSize="sm" color="slate.600">
                  {shipment.store}
                </Text>
              </Table.Cell>
              <Table.Cell fontVariantNumeric="tabular-nums" color="slate.700" whiteSpace="nowrap">
                {shipment.tracking}
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">
                <StatusIndicator status={shipment.status} />
              </Table.Cell>
              <Table.Cell
                textAlign="end"
                fontVariantNumeric="tabular-nums"
                color="slate.700"
                whiteSpace="nowrap"
              >
                {formatWeight(shipment.weightKg)}
              </Table.Cell>
              <Table.Cell pe={6} color="slate.700">
                {shipment.arrival}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function ShipmentsList({ shipments }: RecentShipmentsProps) {
  return (
    <Stack as="ul" display={{ base: 'flex', md: 'none' }} gap={0} listStyleType="none">
      {shipments.map((shipment) => (
        <Box as="li" key={shipment.id} px={5} py={4} borderTopWidth="1px" borderColor="slate.200">
          <Text fontWeight="medium" color="slate.900">
            {shipment.name}
          </Text>
          <Text fontSize="sm" color="slate.600">
            {shipment.store} · {formatWeight(shipment.weightKg)}
          </Text>
          <Flex mt={2.5} wrap="wrap" justify="space-between" columnGap={4} rowGap={1}>
            <StatusIndicator status={shipment.status} />
            <Text fontSize="sm" color="slate.700">
              {shipment.arrival}
            </Text>
          </Flex>
          <Text mt={1.5} fontSize="xs" color="slate.500" fontVariantNumeric="tabular-nums">
            Guía {shipment.tracking}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}

function RecentShipments({ shipments }: RecentShipmentsProps) {
  const isEmpty = shipments.length === 0;

  return (
    <Box
      as="section"
      aria-labelledby="recent-shipments-title"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="slate.200"
      bg="white"
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" gap={4} px={{ base: 5, md: 6 }} py={4}>
        <Text
          as="h2"
          id="recent-shipments-title"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
          color="slate.900"
        >
          Envíos recientes
        </Text>
        {!isEmpty && (
          <Flex
            asChild
            align="center"
            minH={11}
            px={3}
            mr={-3}
            borderRadius="lg"
            fontSize="sm"
            fontWeight="semibold"
            color="brand.700"
            touchAction="manipulation"
            transition="background-color 150ms ease"
            _hover={{ bg: 'brand.50' }}
            _focusVisible={focusRing}
          >
            <Link to="/shipments">Ver todos</Link>
          </Flex>
        )}
      </Flex>

      {isEmpty ? (
        <Box borderTopWidth="1px" borderColor="slate.200">
          <EmptyState />
        </Box>
      ) : (
        <>
          <ShipmentsTable shipments={shipments} />
          <ShipmentsList shipments={shipments} />
        </>
      )}
    </Box>
  );
}

export default RecentShipments;
