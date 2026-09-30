import { Box, Flex, Text } from '@chakra-ui/react';

import { SHIPMENT_STATUS_LABEL } from '../model/shipment-format';
import type { ShipmentStatus } from '../model/types';

const DOT_COLOR: Record<ShipmentStatus, string> = {
  warehouse: 'slate.500',
  in_transit: 'brand.500',
  customs: 'orange.500',
  ready: 'green.600',
};

interface StatusIndicatorProps {
  status: ShipmentStatus;
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <Flex align="center" gap={2}>
      <Box
        aria-hidden="true"
        flexShrink={0}
        boxSize={2}
        borderRadius="full"
        bg={DOT_COLOR[status]}
      />
      <Text as="span" fontSize="sm" fontWeight="medium" color="slate.700">
        {SHIPMENT_STATUS_LABEL[status]}
      </Text>
    </Flex>
  );
}

export default StatusIndicator;
