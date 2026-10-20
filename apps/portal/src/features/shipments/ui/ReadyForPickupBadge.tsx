import { Flex, Text } from '@chakra-ui/react';
import { PackageCheck } from 'lucide-react';

import { READY_FOR_PICKUP_LABEL } from '../model/shipment-labels';

function ReadyForPickupBadge() {
  return (
    <Flex
      align="center"
      gap={1.5}
      alignSelf="flex-start"
      px={2.5}
      py={1}
      borderRadius="full"
      borderWidth="1px"
      borderColor="green.200"
      bg="green.50"
      color="green.800"
    >
      <PackageCheck size={14} strokeWidth={2.25} aria-hidden="true" />
      <Text as="span" fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
        {READY_FOR_PICKUP_LABEL}
      </Text>
    </Flex>
  );
}

export default ReadyForPickupBadge;
