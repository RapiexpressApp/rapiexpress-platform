import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Link } from 'react-router';

import { NEW_PRE_ALERT_PATH, PRE_ALERTS_PATH } from '@/shared/model/paths';

import { usePendingPreAlerts } from '../model/home-queries';
import BlockStatus from './BlockStatus';

const TITLE = 'Pre-alertas por recibir';

const textLink = {
  align: 'center',
  minH: 11,
  px: 3,
  borderRadius: 'lg',
  fontSize: 'sm',
  fontWeight: 'semibold',
  color: 'brand.700',
  touchAction: 'manipulation',
  transition: 'background-color 150ms ease',
  _hover: { bg: 'brand.50' },
  _focusVisible: focusRing,
} as const;

function EmptyState() {
  return (
    <Flex direction="column" align="center" gap={1} px={6} py={8} textAlign="center">
      <Text color="slate.600">No tienes pre-alertas por recibir.</Text>
      <Flex asChild {...textLink}>
        <Link to={NEW_PRE_ALERT_PATH}>Pre-alertar una compra</Link>
      </Flex>
    </Flex>
  );
}

function PendingPreAlerts() {
  const preAlerts = usePendingPreAlerts();
  const items = preAlerts.data?.items ?? [];
  const more = (preAlerts.data?.total ?? 0) - items.length;

  return (
    <Box as="section" aria-labelledby="pending-pre-alerts-title">
      <Flex align="center" justify="space-between" gap={4} mb={2}>
        <Text
          as="h2"
          id="pending-pre-alerts-title"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
          color="slate.900"
        >
          {TITLE}
        </Text>
        {items.length > 0 && (
          <Flex asChild mr={-3} {...textLink}>
            <Link to={PRE_ALERTS_PATH}>Ver todas</Link>
          </Flex>
        )}
      </Flex>

      <BlockStatus
        isPending={preAlerts.isPending}
        isError={preAlerts.isError}
        isEmpty={items.length === 0}
        loadingLabel="Cargando pre-alertas"
        errorMessage="No pudimos cargar tus pre-alertas."
        empty={<EmptyState />}
        onRetry={() => void preAlerts.refetch()}
      >
        <Stack
          as="ul"
          role="list"
          aria-label={TITLE}
          gap={0}
          listStyleType="none"
          borderTopWidth="1px"
          borderColor="slate.200"
        >
          {items.map((item) => (
            <Box as="li" key={item.id} py={3.5} borderBottomWidth="1px" borderColor="slate.200">
              <Flex justify="space-between" gap={4}>
                <Text fontWeight="medium" color="slate.900">
                  {item.store}
                </Text>
                <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
                  Guía {item.trackingNumber}
                </Text>
              </Flex>
              <Text fontSize="sm" color="slate.600" lineClamp={1}>
                {item.description}
              </Text>
            </Box>
          ))}
          {more > 0 && (
            <Text as="li" py={3} fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
              y {more} más
            </Text>
          )}
        </Stack>
      </BlockStatus>
    </Box>
  );
}

export default PendingPreAlerts;
