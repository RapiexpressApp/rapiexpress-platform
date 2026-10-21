import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { PackageDetail } from '@rapiexpress/api-client/packages.schemas';
import { submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { Printer } from 'lucide-react';

import { formatWeightLb } from '@/shared/lib/format';
import { PACKAGE_TYPE_LABEL } from '@/shared/model/package-labels';

import { formatCustomer } from '../model/reception-format';
import FocusHeading from './FocusHeading';
import PrintLabel from './PrintLabel';

interface ReceptionSuccessProps {
  received: PackageDetail;
  onAnother: () => void;
}

function ReceptionSuccess({ received, onAnother }: ReceptionSuccessProps) {
  return (
    <Stack as="section" aria-labelledby="reception-success-title" gap={5}>
      <Stack gap={1}>
        <FocusHeading as="h2" id="reception-success-title" size="md" color="slate.900">
          Paquete recibido
        </FocusHeading>
        <Text
          fontFamily="mono"
          fontWeight="bold"
          fontSize={{ base: '4xl', sm: '5xl' }}
          lineHeight="1.1"
          letterSpacing="tight"
          color="brand.950"
          fontVariantNumeric="tabular-nums"
        >
          {received.warehouseNumber}
        </Text>
      </Stack>

      <Stack gap={1}>
        <Text fontWeight="semibold" color="slate.900">
          {received.customer
            ? `Asignado a ${formatCustomer(received.customer)}`
            : 'Sin asignar: irá a la bandeja de no asignados.'}
        </Text>
        <Text color="slate.600" fontVariantNumeric="tabular-nums">
          {formatWeightLb(received.weightLb)} · {PACKAGE_TYPE_LABEL[received.packageType]}
        </Text>
      </Stack>

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap={3}>
        <Button variant="outline" height={11} px={6} onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" />
          Imprimir etiqueta
        </Button>
        <Button
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
          onClick={onAnother}
        >
          Recibir otro
        </Button>
      </Flex>

      <PrintLabel label={received.label} />
    </Stack>
  );
}

export default ReceptionSuccess;
