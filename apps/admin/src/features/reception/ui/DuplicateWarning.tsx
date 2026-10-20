import { Alert, Badge, Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { ExistingPackage } from '@rapiexpress/api-client/packages.schemas';

import { formatDate } from '@/shared/lib/format';
import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

import FocusHeading from './FocusHeading';

interface DuplicateWarningProps {
  packages: ExistingPackage[];
  onConfirm: () => void;
  onCancel: () => void;
}

function DuplicateWarning({ packages, onConfirm, onCancel }: DuplicateWarningProps) {
  const count = packages.length;

  return (
    <Stack gap={5}>
      <Alert.Root status="warning" variant="subtle" borderRadius="lg" alignItems="flex-start">
        <Alert.Indicator />
        <Alert.Content gap={3}>
          <FocusHeading as="h2" size="md" color="slate.900">
            Esta guía ya fue recibida
          </FocusHeading>
          <Text color="slate.700">
            {count === 1
              ? 'Hay 1 bulto registrado con esta guía.'
              : `Hay ${count} bultos registrados con esta guía.`}{' '}
            Continúa solo si este es otro bulto de la misma compra o envío.
          </Text>
          <Stack as="ul" gap={2} listStyleType="none">
            {packages.map((item) => (
              <Flex
                as="li"
                key={item.id}
                align="center"
                wrap="wrap"
                columnGap={3}
                rowGap={1}
                fontSize="sm"
              >
                <Text as="span" fontFamily="mono" fontWeight="semibold" color="slate.900">
                  {item.warehouseNumber}
                </Text>
                <Badge variant="subtle" colorPalette="gray">
                  {PACKAGE_STATUS_LABEL[item.status]}
                </Badge>
                <Text as="span" color="slate.600" fontVariantNumeric="tabular-nums">
                  {formatDate(item.createdAt)}
                </Text>
                <Text as="span" color="slate.600">
                  {item.customerId === null ? 'Sin asignar' : 'Asignado'}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Alert.Content>
      </Alert.Root>

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap={3}>
        <Button variant="outline" height={11} px={6} onClick={onConfirm}>
          Es otro bulto
        </Button>
        <Button colorPalette="brand" height={11} px={6} onClick={onCancel}>
          Escanear otra guía
        </Button>
      </Flex>
    </Stack>
  );
}

export default DuplicateWarning;
