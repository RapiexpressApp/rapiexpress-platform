import { Badge, Box } from '@chakra-ui/react';
import type { PurchaseStatus } from '@rapiexpress/api-client/purchases.schemas';

import { PURCHASE_STATUS_LABEL } from '@/shared/model/purchase-labels';

const STATUS_PALETTE: Record<PurchaseStatus, string> = {
  PENDING_RECEPTION: 'brand',
  RECEIVED: 'green',
  CANCELLED: 'gray',
};

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus;
}

function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <Badge
      colorPalette={STATUS_PALETTE[status]}
      variant="subtle"
      size="md"
      gap={1.5}
      whiteSpace="nowrap"
    >
      <Box aria-hidden="true" boxSize={1.5} borderRadius="full" bg="colorPalette.solid" />
      {PURCHASE_STATUS_LABEL[status]}
    </Badge>
  );
}

export default PurchaseStatusBadge;
