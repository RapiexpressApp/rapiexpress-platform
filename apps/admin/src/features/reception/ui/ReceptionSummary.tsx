import { Button, DataList, Flex, Stack, Text } from '@chakra-ui/react';
import { submitButtonProps } from '@rapiexpress/ui/auth-form-styles';

import { formatUsd, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL, PACKAGE_TYPE_LABEL } from '@/shared/model/package-labels';

import { formatCustomer } from '../model/reception-format';
import { getTargetCustomer, type ReceptionTarget } from '../model/reception-target';
import type { ReceptionFormValues } from '../validation/reception-form.validation';
import FocusHeading from './FocusHeading';

interface ReceptionSummaryProps {
  trackingNumber: string;
  target: ReceptionTarget;
  values: ReceptionFormValues;
  duplicateConfirmed: boolean;
  pending: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onEdit: () => void;
}

interface Row {
  label: string;
  value: string;
  mono?: boolean;
}

function buildRows(
  trackingNumber: string,
  target: ReceptionTarget,
  values: ReceptionFormValues,
  duplicateConfirmed: boolean
): Row[] {
  const customer = getTargetCustomer(target);

  return [
    { label: 'Guía', value: trackingNumber, mono: true },
    {
      label: 'Cliente',
      value: customer ? formatCustomer(customer) : 'Sin asignar (bandeja de no asignados)',
    },
    ...(target.kind === 'purchase'
      ? [{ label: 'Compra', value: `${target.match.store}: ${target.match.description}` }]
      : []),
    { label: 'Peso', value: formatWeightLb(values.weightLb) },
    { label: 'Tipo', value: PACKAGE_TYPE_LABEL[values.packageType ?? 'NORMAL'] },
    ...(values.category ? [{ label: 'Categoría', value: CATEGORY_LABEL[values.category] }] : []),
    ...(values.declaredValueUsd !== undefined
      ? [{ label: 'Valor declarado', value: formatUsd(values.declaredValueUsd) }]
      : []),
    ...(values.description ? [{ label: 'Descripción', value: values.description }] : []),
    ...(values.notes ? [{ label: 'Notas', value: values.notes }] : []),
    ...(duplicateConfirmed ? [{ label: 'Duplicado', value: 'Confirmado como otro bulto' }] : []),
  ];
}

function ReceptionSummary({
  trackingNumber,
  target,
  values,
  duplicateConfirmed,
  pending,
  errorMessage,
  onConfirm,
  onEdit,
}: ReceptionSummaryProps) {
  return (
    <Stack gap={5}>
      <Stack gap={1}>
        <FocusHeading as="h2" size="md" color="slate.900">
          Confirma la recepción
        </FocusHeading>
        <Text color="slate.600">Revisa los datos antes de registrar el bulto.</Text>
      </Stack>

      <DataList.Root orientation="horizontal" size="md" gap={2}>
        {buildRows(trackingNumber, target, values, duplicateConfirmed).map((row) => (
          <DataList.Item key={row.label}>
            <DataList.ItemLabel>{row.label}</DataList.ItemLabel>
            <DataList.ItemValue
              fontFamily={row.mono ? 'mono' : undefined}
              fontVariantNumeric="tabular-nums"
              wordBreak="break-word"
            >
              {row.value}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>

      {errorMessage && (
        <Text role="alert" fontSize="sm" color="red.600">
          {errorMessage}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap={3}>
        <Button variant="outline" height={11} px={6} disabled={pending} onClick={onEdit}>
          Editar datos
        </Button>
        <Button
          loading={pending}
          loadingText="Registrando"
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
          onClick={() => {
            if (!pending) onConfirm();
          }}
        >
          Confirmar recepción
        </Button>
      </Flex>
    </Stack>
  );
}

export default ReceptionSummary;
