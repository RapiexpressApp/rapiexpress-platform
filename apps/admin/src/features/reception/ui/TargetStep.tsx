import { Button, Separator, Stack, Text } from '@chakra-ui/react';
import type { ReceptionLookup } from '@rapiexpress/api-client/packages.schemas';

import type { ReceptionTarget } from '../model/reception-target';
import CustomerSearch from './CustomerSearch';
import FocusHeading from './FocusHeading';
import MatchPicker from './MatchPicker';

interface TargetStepProps {
  lookup: ReceptionLookup;
  onChoose: (target: ReceptionTarget) => void;
}

function TargetStep({ lookup, onChoose }: TargetStepProps) {
  if (lookup.matches.length > 0) {
    return (
      <MatchPicker
        matches={lookup.matches}
        onChoose={(match) => onChoose({ kind: 'purchase', match })}
      />
    );
  }

  return (
    <Stack gap={5}>
      <Stack gap={1}>
        <FocusHeading as="h2" size="md" color="slate.900">
          No encontramos una pre-alerta para esta guía
        </FocusHeading>
        <Text color="slate.600">
          Busca al cliente para asignarle el bulto o recíbelo sin cliente.
        </Text>
      </Stack>

      <CustomerSearch onChoose={(customer) => onChoose({ kind: 'customer', customer })} />

      <Separator />

      <Stack gap={2} align="flex-start">
        <Button
          variant="outline"
          height={11}
          px={6}
          onClick={() => onChoose({ kind: 'unassigned' })}
        >
          Sin cliente (bandeja de no asignados)
        </Button>
        <Text fontSize="sm" color="slate.600">
          Operaciones podrá asignarle un cliente después.
        </Text>
      </Stack>
    </Stack>
  );
}

export default TargetStep;
