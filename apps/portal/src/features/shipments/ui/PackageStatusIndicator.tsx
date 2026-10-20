import { Box, Flex, Text } from '@chakra-ui/react';
import type { VisiblePackageStatus } from '@rapiexpress/api-client/tracking.schemas';

import { PACKAGE_STATUS_LABEL } from '../model/shipment-labels';

const DOT_COLOR: Record<VisiblePackageStatus, string> = {
  WAREHOUSE: 'slate.500',
  SHIPPED: 'brand.500',
  CUSTOMS: 'orange.500',
  AGENCY: 'brand.700',
  DELIVERED: 'green.600',
};

interface PackageStatusIndicatorProps {
  status: VisiblePackageStatus;
}

function PackageStatusIndicator({ status }: PackageStatusIndicatorProps) {
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
        {PACKAGE_STATUS_LABEL[status]}
      </Text>
    </Flex>
  );
}

export default PackageStatusIndicator;
