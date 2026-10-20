import { Box, Stack, Text } from '@chakra-ui/react';
import type { PackageEvent } from '@rapiexpress/api-client/packages.schemas';

import { formatDateTime } from '@/shared/lib/format';
import { EVENT_SOURCE_LABEL, PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

import DetailSection from './DetailSection';

interface PackageHistorySectionProps {
  events: PackageEvent[];
}

function describeChange({ fromStatus, toStatus }: PackageEvent): string {
  const to = PACKAGE_STATUS_LABEL[toStatus];
  return fromStatus ? `${PACKAGE_STATUS_LABEL[fromStatus]} → ${to}` : to;
}

function PackageHistorySection({ events }: PackageHistorySectionProps) {
  const oldestFirst = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  return (
    <DetailSection title="Historial">
      <Stack as="ol" gap={0} listStyleType="none">
        {oldestFirst.map((event, index) => (
          <Box
            as="li"
            key={`${event.occurredAt}-${index}`}
            position="relative"
            ps={5}
            pb={4}
            borderStartWidth="2px"
            borderColor="slate.200"
            _last={{ pb: 0 }}
          >
            <Box
              aria-hidden="true"
              position="absolute"
              insetStart="-5px"
              top="6px"
              boxSize={2}
              borderRadius="full"
              bg="slate.500"
            />
            <Text fontWeight="medium" color="slate.900">
              {describeChange(event)}
            </Text>
            <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
              {`${EVENT_SOURCE_LABEL[event.source]} · ${event.actor.name} ${event.actor.lastName} · ${formatDateTime(event.occurredAt)}`}
            </Text>
          </Box>
        ))}
      </Stack>
    </DetailSection>
  );
}

export default PackageHistorySection;
