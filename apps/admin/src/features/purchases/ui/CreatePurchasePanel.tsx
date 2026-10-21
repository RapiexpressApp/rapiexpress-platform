import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomerSearch from '@/features/reception/ui/CustomerSearch';
import { useDialogBusy } from '@/shared/lib/dialog-busy';
import { useSingleFlight } from '@/shared/lib/use-single-flight';

import { classifyCreateError } from '../model/purchase-errors';
import { useCreatePurchase } from '../model/use-create-purchase';
import {
  type PurchaseFormInput,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../validation/purchase-form.validation';
import PurchaseFormFields from './PurchaseFormFields';

interface CreatePurchasePanelProps {
  onCreated: () => void;
  onCancel: () => void;
}

const EMPTY_VALUES: PurchaseFormInput = {
  customerId: '',
  store: '',
  trackingNumber: '',
  description: '',
  declaredValueUsd: '',
  estimatedWeightLb: '',
  suggestedCategory: '',
};

function CreatePurchasePanel({ onCreated, onCancel }: CreatePurchasePanelProps) {
  const create = useSingleFlight(useCreatePurchase());
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const form = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
  });
  useDialogBusy(create.isPending);

  function handleChoose(chosen: CustomerSummary) {
    create.reset();
    form.setValue('customerId', chosen.id);
    setCustomer(chosen);
  }

  function handleChangeCustomer() {
    form.setValue('customerId', '');
    setCustomer(null);
  }

  function handleSubmit(values: PurchaseFormValues) {
    create.submit(values, {
      onSuccess: onCreated,
      onError: (error) => {
        const failure = classifyCreateError(error);
        if (failure.kind === 'duplicate') {
          form.setError(
            'trackingNumber',
            { type: 'server', message: failure.message },
            { shouldFocus: true }
          );
        } else if (failure.kind === 'customer-inactive') {
          handleChangeCustomer();
        }
      },
    });
  }

  const failure = create.isError ? classifyCreateError(create.error) : null;

  if (!customer) {
    return (
      <Stack gap={4}>
        <Text fontSize="sm" fontWeight="semibold" color="slate.600">
          Paso 1 de 2 · Cliente
        </Text>
        {failure?.kind === 'customer-inactive' && (
          <Text role="alert" fontSize="sm" color="red.600">
            {failure.message}
          </Text>
        )}
        <CustomerSearch autoFocus onChoose={handleChoose} />
        <Flex justify="flex-end">
          <Button variant="outline" height={11} px={6} onClick={onCancel}>
            Cancelar
          </Button>
        </Flex>
      </Stack>
    );
  }

  return (
    <PurchaseFormFields
      customer={customer}
      form={form}
      pending={create.isPending}
      message={failure?.kind === 'message' ? failure.message : null}
      onSubmit={handleSubmit}
      onChangeCustomer={handleChangeCustomer}
      onCancel={onCancel}
    />
  );
}

export default CreatePurchasePanel;
