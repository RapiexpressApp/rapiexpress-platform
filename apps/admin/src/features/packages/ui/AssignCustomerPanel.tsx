import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { getApiErrorCode } from '@rapiexpress/api-client/http-error';
import { useState } from 'react';

import { formatCustomer } from '@/features/reception/model/reception-format';
import CustomerSearch from '@/features/reception/ui/CustomerSearch';
import { useSingleFlight } from '@/shared/lib/use-single-flight';

import { useDialogBusy } from '../model/dialog-busy';
import { classifyAssignError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { useAssignCustomer } from '../model/use-package-mutations';

interface AssignCustomerPanelProps {
  packageId: string;
  warehouseNumber: string;
  onAssigned: () => void;
  onCancel: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

function AssignCustomerPanel({
  packageId,
  warehouseNumber,
  onAssigned,
  onCancel,
  onStale,
}: AssignCustomerPanelProps) {
  const assign = useSingleFlight(useAssignCustomer(packageId));
  const [chosen, setChosen] = useState<CustomerSummary | null>(null);
  useDialogBusy(assign.isPending);

  function handleChoose(customer: CustomerSummary) {
    assign.reset();
    setChosen(customer);
  }

  function handleAssign() {
    if (!chosen) return;
    assign.submit(chosen.id, {
      onSuccess: onAssigned,
      onError: (error) => {
        const failure = classifyAssignError(error);
        if (failure.kind === 'stale') onStale(failure.notice);
        else if (getApiErrorCode(error) === 'CUSTOMER_NOT_FOUND') setChosen(null);
      },
    });
  }

  const failure = assign.isError ? classifyAssignError(assign.error) : null;

  return (
    <Stack gap={4}>
      {failure?.kind === 'inline' && (
        <Text role="alert" fontSize="sm" color="red.600">
          {failure.message}
        </Text>
      )}

      {chosen ? (
        <Stack gap={4}>
          <Text color="slate.800">
            {`El paquete ${warehouseNumber} quedará asignado a `}
            <Text as="span" fontWeight="semibold">
              {formatCustomer(chosen)}
            </Text>
            .
          </Text>
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3}>
            <Button
              variant="outline"
              height={11}
              px={6}
              disabled={assign.isPending}
              onClick={() => setChosen(null)}
            >
              Elegir otro cliente
            </Button>
            <Button
              colorPalette="brand"
              height={11}
              px={6}
              fontWeight="semibold"
              loading={assign.isPending}
              loadingText="Asignando"
              onClick={handleAssign}
            >
              Asignar cliente
            </Button>
          </Flex>
        </Stack>
      ) : (
        <>
          <CustomerSearch onChoose={handleChoose} />
          <Flex justify="flex-end">
            <Button variant="outline" height={11} px={6} onClick={onCancel}>
              Cancelar
            </Button>
          </Flex>
        </>
      )}
    </Stack>
  );
}

export default AssignCustomerPanel;
