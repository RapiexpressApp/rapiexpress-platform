import {
  Button,
  chakra,
  Flex,
  Grid,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useId } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { formatCustomer } from '@/features/reception/model/reception-format';
import { CATEGORY_LABEL } from '@/shared/model/package-labels';

import type { PurchaseFormInput, PurchaseFormValues } from '../validation/purchase-form.validation';
import CategoryGuide from './CategoryGuide';

interface PurchaseFormFieldsProps {
  customer: CustomerSummary;
  form: UseFormReturn<PurchaseFormInput, unknown, PurchaseFormValues>;
  pending: boolean;
  message: string | null;
  onSubmit: (values: PurchaseFormValues) => void;
  onChangeCustomer: () => void;
  onCancel: () => void;
}

const fieldStyles = { ...inputStyles, px: 3.5 };
const numberStyles = { ...fieldStyles, fontVariantNumeric: 'tabular-nums' };

function PurchaseFormFields({
  customer,
  form,
  pending,
  message,
  onSubmit,
  onChangeCustomer,
  onCancel,
}: PurchaseFormFieldsProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;
  const category = useWatch({ control, name: 'suggestedCategory' });
  const guideId = useId();

  return (
    <chakra.form
      noValidate
      aria-label="Datos de la pre-alerta"
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Text fontSize="sm" fontWeight="semibold" color="slate.600">
        Paso 2 de 2 · Datos de la compra
      </Text>

      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Stack gap={0}>
          <Text fontSize="xs" color="slate.600">
            Cliente
          </Text>
          <Text fontWeight="semibold" color="slate.900">
            {formatCustomer(customer)}
          </Text>
        </Stack>
        <Button variant="outline" height={11} px={4} disabled={pending} onClick={onChangeCustomer}>
          Cambiar cliente
        </Button>
      </Flex>

      <AuthField label="Tienda" error={errors.store?.message}>
        <Input
          autoFocus
          autoComplete="off"
          placeholder="Amazon, Shein, eBay…"
          css={fieldStyles}
          {...register('store')}
        />
      </AuthField>

      <AuthField
        label="Guía de seguimiento"
        error={errors.trackingNumber?.message}
        hint="El número de rastreo que dio la tienda."
      >
        <Input
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          css={fieldStyles}
          {...register('trackingNumber')}
        />
      </AuthField>

      <AuthField label="Descripción" error={errors.description?.message}>
        <Textarea
          rows={2}
          placeholder="Qué contiene el paquete"
          css={{ ...fieldStyles, height: 'auto', minH: 20, py: 2.5 }}
          {...register('description')}
        />
      </AuthField>

      <Grid templateColumns={{ base: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }} gap={4}>
        <AuthField
          label="Valor declarado (USD)"
          error={errors.declaredValueUsd?.message}
          hint="Sin símbolos. Ejemplo: 45,90"
        >
          <Input
            inputMode="decimal"
            autoComplete="off"
            css={numberStyles}
            {...register('declaredValueUsd')}
          />
        </AuthField>

        <AuthField
          label="Peso estimado (lb)"
          error={errors.estimatedWeightLb?.message}
          hint="Una aproximación está bien. Ejemplo: 2,5"
        >
          <Input
            inputMode="decimal"
            autoComplete="off"
            css={numberStyles}
            {...register('estimatedWeightLb')}
          />
        </AuthField>
      </Grid>

      <AuthField label="Categoría sugerida" error={errors.suggestedCategory?.message}>
        <NativeSelect.Root>
          <NativeSelect.Field
            aria-describedby={guideId}
            css={fieldStyles}
            {...register('suggestedCategory')}
          >
            <option value="">Selecciona una categoría</option>
            {CUSTOMS_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <CategoryGuide id={guideId} selected={category} />
      </AuthField>

      {message && (
        <Text role="alert" fontSize="sm" color="red.600">
          {message}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button variant="outline" height={11} px={6} disabled={pending} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          loadingText="Creando"
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
        >
          Crear pre-alerta
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default PurchaseFormFields;
