import { Box, Button, Stack, Text } from '@chakra-ui/react';
import type { ReceptionMatch } from '@rapiexpress/api-client/packages.schemas';

import { formatCustomer } from '../model/reception-format';
import FocusHeading from './FocusHeading';
import MatchDetails from './MatchDetails';

interface MatchPickerProps {
  matches: ReceptionMatch[];
  onChoose: (match: ReceptionMatch) => void;
}

function MatchPicker({ matches, onChoose }: MatchPickerProps) {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <FocusHeading as="h2" size="md" color="slate.900">
          Esta guía coincide con varias compras
        </FocusHeading>
        <Text color="slate.600">Elige la compra que corresponde a este bulto.</Text>
      </Stack>

      <Stack as="ul" gap={3} listStyleType="none">
        {matches.map((match) => (
          <Box
            as="li"
            key={match.purchaseId}
            borderWidth="1px"
            borderColor="slate.200"
            borderRadius="lg"
            bg="white"
            p={4}
          >
            <Stack gap={3}>
              <MatchDetails match={match} />
              <Button
                aria-label={`Usar esta compra de ${match.store}, ${formatCustomer(match.customer)}`}
                colorPalette="brand"
                height={11}
                px={6}
                alignSelf={{ base: 'stretch', sm: 'flex-start' }}
                onClick={() => onChoose(match)}
              >
                Usar esta compra
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

export default MatchPicker;
