import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { focusRing, pressable } from '@rapiexpress/ui/interaction';
import { PackageOpen, Plus } from 'lucide-react';
import { Link } from 'react-router';

import ShipmentsList from '@/features/shipments/ui/ShipmentsList';
import { NEW_PRE_ALERT_PATH, SHIPMENTS_PATH } from '@/shared/model/paths';

import { useRecentPackages } from '../model/home-queries';
import BlockStatus from './BlockStatus';

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
        <Link to={NEW_PRE_ALERT_PATH}>
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          Pre-alertar mi primera compra
        </Link>
      </Button>
    </Flex>
  );
}

function RecentShipments() {
  const packages = useRecentPackages();
  const items = packages.data?.items ?? [];

  return (
    <Box as="section" aria-labelledby="recent-shipments-title">
      <Flex align="center" justify="space-between" gap={4} mb={2}>
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
        {items.length > 0 && (
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
            <Link to={SHIPMENTS_PATH}>Ver todos</Link>
          </Flex>
        )}
      </Flex>

      <BlockStatus
        isPending={packages.isPending}
        isError={packages.isError}
        isEmpty={items.length === 0}
        loadingLabel="Cargando envíos recientes"
        errorMessage="No pudimos cargar tus envíos recientes."
        empty={<EmptyState />}
        onRetry={() => void packages.refetch()}
      >
        <ShipmentsList packages={items} />
      </BlockStatus>
    </Box>
  );
}

export default RecentShipments;
