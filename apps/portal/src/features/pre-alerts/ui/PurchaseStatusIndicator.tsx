import { Box, Flex, Text } from '@chakra-ui/react';
import type { PurchaseStatus } from '@rapiexpress/api-client/purchases.schemas';

import { PURCHASE_STATUS_LABEL } from '../model/purchase-labels';

const DOT_COLOR: Record<PurchaseStatus, string> = {
  PENDING_RECEPTION: 'brand.500',
  RECEIVED: 'green.600',
  CANCELLED: 'slate.500',
};

interface PurchaseStatusIndicatorProps {
  status: PurchaseStatus;
}

function PurchaseStatusIndicator({ status }: PurchaseStatusIndicatorProps) {
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
        {PURCHASE_STATUS_LABEL[status]}
      </Text>
    </Flex>
  );
}

export default PurchaseStatusIndicator;
