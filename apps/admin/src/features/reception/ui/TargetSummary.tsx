import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

import { formatCustomer } from '../model/reception-format';
import type { ReceptionTarget } from '../model/reception-target';
import MatchDetails from './MatchDetails';

interface TargetSummaryProps {
  target: ReceptionTarget;
  onChange?: () => void;
}

function TargetSummary({ target, onChange }: TargetSummaryProps) {
  return (
    <Flex
      justify="space-between"
      align="flex-start"
      wrap="wrap"
      gap={3}
      borderStartWidth="3px"
      borderColor="brand.500"
      ps={4}
    >
      <Box minW={0} flex="1 1 14rem">
        {target.kind === 'purchase' && (
          <>
            <Heading as="h2" size="sm" color="slate.900" mb={2}>
              Compra encontrada
            </Heading>
            <MatchDetails match={target.match} />
          </>
        )}
        {target.kind === 'customer' && (
          <Text fontWeight="semibold" color="slate.900">
            Cliente: {formatCustomer(target.customer)}
          </Text>
        )}
        {target.kind === 'unassigned' && (
          <Text fontWeight="semibold" color="slate.900">
            Sin cliente: irá a la bandeja de no asignados.
          </Text>
        )}
      </Box>
      {onChange && (
        <Button variant="ghost" size="sm" minH={11} onClick={onChange}>
          Cambiar destino
        </Button>
      )}
    </Flex>
  );
}

export default TargetSummary;
