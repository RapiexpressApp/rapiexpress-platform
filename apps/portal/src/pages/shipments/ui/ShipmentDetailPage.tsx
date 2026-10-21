import { Box, Button, Flex, Skeleton, Stack, Text } from '@chakra-ui/react';
import { uuidSchema } from '@rapiexpress/api-client/field-schemas';
import type { MyPackageDetail } from '@rapiexpress/api-client/tracking.schemas';
import { focusRing, pressable } from '@rapiexpress/ui/interaction';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';

import {
  isPackageNotFound,
  LOAD_SHIPMENT_FAILED_MESSAGE,
} from '@/features/shipments/model/shipment-errors';
import { buildShipmentTimeline } from '@/features/shipments/model/shipment-timeline';
import { useMyPackage } from '@/features/shipments/model/use-my-package';
import PackageStatusIndicator from '@/features/shipments/ui/PackageStatusIndicator';
import ReadyForPickupCallout from '@/features/shipments/ui/ReadyForPickupCallout';
import ShipmentTimeline from '@/features/shipments/ui/ShipmentTimeline';
import { SHIPMENTS_PATH } from '@/shared/model/paths';

import ShipmentData from './ShipmentData';

function BackToShipments() {
  return (
    <Flex
      asChild
      align="center"
      alignSelf="flex-start"
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
      <Link to={SHIPMENTS_PATH}>
        <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        Mis envíos
      </Link>
    </Flex>
  );
}

function ShipmentDetail({ detail }: { detail: MyPackageDetail }) {
  return (
    <Stack gap={6}>
      <BackToShipments />

      <Stack as="header" gap={2}>
        <Text
          as="h1"
          fontSize={{ base: '3xl', md: '4xl' }}
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="1.15"
          fontVariantNumeric="tabular-nums"
          color="slate.900"
        >
          {detail.warehouseNumber}
        </Text>
        <Text fontSize="md" color="slate.600" fontVariantNumeric="tabular-nums">
          Guía {detail.trackingNumber}
        </Text>
        <PackageStatusIndicator status={detail.status} />
      </Stack>

      {detail.readyForPickup && <ReadyForPickupCallout />}

      <Box as="section" aria-labelledby="shipment-timeline-title">
        <Text
          as="h2"
          id="shipment-timeline-title"
          mb={3}
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
          color="slate.900"
        >
          Seguimiento
        </Text>
        <Box
          p={{ base: 5, md: 6 }}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="slate.200"
          bg="white"
        >
          <ShipmentTimeline steps={buildShipmentTimeline(detail.status, detail.timeline)} />
        </Box>
      </Box>

      <ShipmentData detail={detail} />
    </Stack>
  );
}

function ShipmentDetailSkeleton() {
  return (
    <Stack role="status" aria-label="Cargando envío" gap={6}>
      <Skeleton h={6} w={32} />
      <Stack gap={3}>
        <Skeleton h={10} w="40%" />
        <Skeleton h={5} w="55%" />
      </Stack>
      <Skeleton h={40} borderRadius="xl" />
      <Skeleton h={48} borderRadius="xl" />
    </Stack>
  );
}

function ShipmentNotFound() {
  return (
    <Stack gap={6}>
      <BackToShipments />
      <Flex direction="column" align="center" gap={3} py={12} textAlign="center">
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
        <Text as="h1" fontSize="2xl" fontWeight="semibold" letterSpacing="tight" color="slate.900">
          No encontramos este envío
        </Text>
        <Text maxW="md" color="slate.600">
          Revisa que el enlace sea correcto o búscalo en tu lista de envíos.
        </Text>
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
          <Link to={SHIPMENTS_PATH}>Ver mis envíos</Link>
        </Button>
      </Flex>
    </Stack>
  );
}

function ShipmentLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Stack gap={6}>
      <BackToShipments />
      <Flex role="alert" direction="column" align="center" gap={3} py={12}>
        <Text color="slate.700">{LOAD_SHIPMENT_FAILED_MESSAGE}</Text>
        <Button variant="outline" height={11} px={5} onClick={onRetry}>
          Reintentar
        </Button>
      </Flex>
    </Stack>
  );
}

function ShipmentDetailPage() {
  const { id = '' } = useParams();
  const validId = uuidSchema.safeParse(id).success;
  const shipment = useMyPackage(validId ? id : undefined);
  const notFound = !validId || (shipment.isError && isPackageNotFound(shipment.error));
  const title = shipment.data
    ? `Envío ${shipment.data.warehouseNumber}`
    : notFound
      ? 'Envío no encontrado'
      : 'Envío';

  useEffect(() => {
    document.title = `${title} · Rapiexpress`;
  }, [title]);

  if (notFound) return <ShipmentNotFound />;
  if (shipment.isError) return <ShipmentLoadError onRetry={() => void shipment.refetch()} />;
  if (!shipment.data) return <ShipmentDetailSkeleton />;

  return <ShipmentDetail detail={shipment.data} />;
}

export default ShipmentDetailPage;
