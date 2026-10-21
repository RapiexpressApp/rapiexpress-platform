import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { useState } from 'react';

import { formatCustomer } from '@/features/reception/model/reception-format';
import CustomerSearch from '@/features/reception/ui/CustomerSearch';

interface CreatePurchasePanelProps {
  onCancel: () => void;
}

function CreatePurchasePanel({ onCancel }: CreatePurchasePanelProps) {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);

  if (!customer) {
    return (
      <Stack gap={4}>
        <Text fontSize="sm" fontWeight="semibold" color="slate.600">
          Paso 1 de 2 · Cliente
        </Text>
        <CustomerSearch autoFocus onChoose={setCustomer} />
        <Flex justify="flex-end">
          <Button variant="outline" height={11} px={6} onClick={onCancel}>
            Cancelar
          </Button>
        </Flex>
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Text fontSize="sm" fontWeight="semibold" color="slate.600">
        Paso 2 de 2 · Datos de la compra
      </Text>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Text fontWeight="semibold" color="slate.900">
          {formatCustomer(customer)}
        </Text>
        <Button variant="outline" height={11} px={4} onClick={() => setCustomer(null)}>
          Cambiar cliente
        </Button>
      </Flex>
    </Stack>
  );
}

export default CreatePurchasePanel;
