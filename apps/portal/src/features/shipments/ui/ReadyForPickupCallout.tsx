import { Box, Flex, Text } from '@chakra-ui/react';
import { PackageCheck } from 'lucide-react';

import { READY_FOR_PICKUP_LABEL } from '../model/shipment-labels';

function ReadyForPickupCallout() {
  return (
    <Flex
      align="center"
      gap={3}
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="green.200"
      bg="green.50"
    >
      <Flex
        aria-hidden="true"
        align="center"
        justify="center"
        flexShrink={0}
        boxSize={10}
        borderRadius="full"
        bg="white"
        color="green.700"
      >
        <PackageCheck size={20} strokeWidth={2.25} />
      </Flex>
      <Box minW={0}>
        <Text fontWeight="semibold" color="green.900">
          {READY_FOR_PICKUP_LABEL}
        </Text>
        <Text fontSize="sm" color="green.800">
          Tu paquete ya está en la agencia. Puedes pasar a retirarlo.
        </Text>
      </Box>
    </Flex>
  );
}

export default ReadyForPickupCallout;
