import { Badge, Box } from '@chakra-ui/react';
import type { PackageStatus } from '@rapiexpress/api-client/packages.schemas';

import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

const STATUS_PALETTE: Record<PackageStatus, string> = {
  IN_WAREHOUSE: 'gray',
  CONSOLIDATED: 'gray',
  IN_BAG: 'gray',
  SHIPPED: 'brand',
  IN_CUSTOMS: 'orange',
  AT_AGENCY: 'brand',
  READY_FOR_PICKUP: 'green',
  DELIVERED: 'gray',
};

interface PackageStatusBadgeProps {
  status: PackageStatus;
}

function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  return (
    <Badge
      colorPalette={STATUS_PALETTE[status]}
      variant="subtle"
      size="md"
      gap={1.5}
      whiteSpace="nowrap"
    >
      <Box aria-hidden="true" boxSize={1.5} borderRadius="full" bg="colorPalette.solid" />
      {PACKAGE_STATUS_LABEL[status]}
    </Badge>
  );
}

export default PackageStatusBadge;
