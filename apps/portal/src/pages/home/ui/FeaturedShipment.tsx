import { Box, Flex, Text } from '@chakra-ui/react';
import type { MyPackageDetail } from '@rapiexpress/api-client/tracking.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { buildShipmentTimeline } from '@/features/shipments/model/shipment-timeline';
import PackageStatusIndicator from '@/features/shipments/ui/PackageStatusIndicator';
import ReadyForPickupBadge from '@/features/shipments/ui/ReadyForPickupBadge';
import ShipmentTimeline from '@/features/shipments/ui/ShipmentTimeline';
import { formatDate, formatWeightLb } from '@/shared/lib/format';
import { shipmentPath } from '@/shared/model/paths';

import { useFeaturedShipment } from '../model/use-featured-shipment';
import BlockStatus from './BlockStatus';

function FeaturedCard({ detail }: { detail: MyPackageDetail }) {
  return (
    <Flex
      as="section"
      aria-labelledby="featured-shipment-title"
      direction="column"
      gap={{ base: 6, md: 8 }}
      p={{ base: 5, md: 6 }}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="slate.200"
      bg="white"
    >
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
        <Box minW={0}>
          {detail.readyForPickup ? (
            <ReadyForPickupBadge />
          ) : (
            <Text fontSize="sm" color="slate.600">
              Tu envío más reciente
            </Text>
          )}
          <Text
            as="h2"
            id="featured-shipment-title"
            mt={detail.readyForPickup ? 2 : 0}
            fontSize="xl"
            fontWeight="semibold"
            letterSpacing="tight"
            color="slate.900"
            overflowWrap="anywhere"
          >
            {detail.description ?? detail.warehouseNumber}
          </Text>
          <Text
            mt={0.5}
            fontSize="sm"
            color="slate.600"
            fontVariantNumeric="tabular-nums"
            overflowWrap="anywhere"
          >
            {detail.warehouseNumber} · {formatWeightLb(detail.weightLb)} · Guía{' '}
            {detail.trackingNumber}
          </Text>
        </Box>

        <Flex
          direction="column"
          gap={1}
          alignItems={{ base: 'flex-start', md: 'flex-end' }}
          flexShrink={0}
        >
          <PackageStatusIndicator status={detail.status} />
          <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
            Recibido {formatDate(detail.receivedAt)}
          </Text>
        </Flex>
      </Flex>

      <ShipmentTimeline steps={buildShipmentTimeline(detail.status, detail.timeline)} />

      <Flex pt={4} borderTopWidth="1px" borderColor="slate.200">
        <Flex
          asChild
          align="center"
          gap={2}
          minH={11}
          px={3}
          ml={-3}
          borderRadius="lg"
          fontSize="sm"
          fontWeight="semibold"
          color="brand.700"
          touchAction="manipulation"
          transition="background-color 150ms ease"
          _hover={{ bg: 'brand.50' }}
          _focusVisible={focusRing}
        >
          <Link to={shipmentPath(detail.id)}>
            Ver detalle del envío
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}

function FeaturedShipment() {
  const featured = useFeaturedShipment();

  if (featured.kind === 'none') return null;
  if (featured.kind === 'ready') return <FeaturedCard detail={featured.detail} />;

  return (
    <BlockStatus
      isPending={featured.kind === 'pending'}
      isError={featured.kind === 'error'}
      isEmpty={false}
      loadingLabel="Cargando envío destacado"
      errorMessage="No pudimos cargar tu envío destacado."
      empty={null}
      onRetry={featured.retry}
    >
      {null}
    </BlockStatus>
  );
}

export default FeaturedShipment;
