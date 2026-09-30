import { Box, Flex, Text } from '@chakra-ui/react';
import { ArrowRight, Headphones } from 'lucide-react';
import { Link } from 'react-router';

import { focusRing } from '@/shared/ui/interaction';

import { formatWeight } from '../model/shipment-format';
import type { FeaturedShipmentView } from '../model/types';
import ShipmentTimeline from './ShipmentTimeline';
import StatusIndicator from './StatusIndicator';

interface FeaturedShipmentProps {
  featured: FeaturedShipmentView;
}

function FeaturedShipment({ featured }: FeaturedShipmentProps) {
  const { shipment, etaLabel, steps } = featured;

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
        <Flex gap={4} minW={0}>
          <Flex
            aria-hidden="true"
            align="center"
            justify="center"
            flexShrink={0}
            boxSize={11}
            borderRadius="lg"
            bg="brand.50"
            color="brand.600"
          >
            <Headphones size={22} />
          </Flex>
          <Box minW={0}>
            <Text fontSize="sm" color="slate.600">
              Próximo en llegar
            </Text>
            <Text
              as="h2"
              id="featured-shipment-title"
              fontSize="xl"
              fontWeight="semibold"
              letterSpacing="tight"
              color="slate.900"
            >
              {shipment.name}
            </Text>
            <Text mt={0.5} fontSize="sm" color="slate.600" overflowWrap="anywhere">
              {shipment.store} · {formatWeight(shipment.weightKg)} · Guía {shipment.tracking}
            </Text>
          </Box>
        </Flex>

        <Flex
          direction="column"
          gap={1}
          alignItems={{ base: 'flex-start', md: 'flex-end' }}
          flexShrink={0}
        >
          <StatusIndicator status={shipment.status} />
          <Text fontSize="md" fontWeight="semibold" color="slate.900">
            {etaLabel}
          </Text>
        </Flex>
      </Flex>

      <ShipmentTimeline steps={steps} />

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
          <Link to="/shipments">
            Ver detalle del envío
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default FeaturedShipment;
