import { Button, chakra, Flex, Grid, Input, NativeSelect, Text, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';
import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useEffect, useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  CREATE_PURCHASE_FAILED_MESSAGE,
  DUPLICATE_PURCHASE_MESSAGE,
  isDuplicatePurchaseError,
  isPurchaseNotPendingError,
  NO_CHANGES_MESSAGE,
  UPDATE_PURCHASE_FAILED_MESSAGE,
} from '../model/pre-alert-errors';
import { toFormValues } from '../model/purchase-form-values';
import { CATEGORY_LABEL } from '../model/purchase-labels';
import { useSavePurchase } from '../model/use-save-purchase';
import {
  type PurchaseFormInput,
  purchaseFormSchema,
  type PurchaseFormValues,
} from '../validation/purchase.validation';
import CategoryGuide from './CategoryGuide';

interface PurchaseFormProps {
  purchase?: Purchase;
  onSaved: () => void;
  onNotPending?: () => void;
  onBusyChange: (busy: boolean) => void;
  onCancel: () => void;
}

const fieldStyles = { ...inputStyles, px: 3.5 };

const EMPTY_VALUES: PurchaseFormInput = {
  store: '',
  trackingNumber: '',
  description: '',
  declaredValueUsd: '',
  estimatedWeightLb: '',
  suggestedCategory: '' as PurchaseFormInput['suggestedCategory'],
};

function PurchaseForm({
  purchase,
  onSaved,
  onNotPending,
  onBusyChange,
  onCancel,
}: PurchaseFormProps) {
  const isEdit = purchase !== undefined;
  const savePurchase = useSavePurchase(purchase);
  const [submittedWithoutChanges, setSubmittedWithoutChanges] = useState(false);
  const guideId = useId();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: purchase ? toFormValues(purchase) : EMPTY_VALUES,
    mode: 'onSubmit',
  });
  const category = useWatch({ control, name: 'suggestedCategory' });
  const pending = savePurchase.isPending;

  useEffect(() => {
    onBusyChange(pending);
    return () => onBusyChange(false);
  }, [pending, onBusyChange]);

  function onSubmit(values: PurchaseFormValues) {
    if (savePurchase.isPending) return;
    if (!savePurchase.hasChanges(values)) {
      setSubmittedWithoutChanges(true);
      return;
    }
    setSubmittedWithoutChanges(false);
    savePurchase.save(values, {
      onSuccess: onSaved,
      onError: (error) => {
        if (isDuplicatePurchaseError(error)) {
          setError(
            'trackingNumber',
            { type: 'server', message: DUPLICATE_PURCHASE_MESSAGE },
            { shouldFocus: true }
          );
        } else if (isPurchaseNotPendingError(error)) {
          onNotPending?.();
        }
      },
    });
  }

  const genericError =
    savePurchase.isError &&
    !isDuplicatePurchaseError(savePurchase.error) &&
    !isPurchaseNotPendingError(savePurchase.error);

  return (
    <chakra.form
      noValidate
      display="flex"
      flexDirection="column"
      gap={4}
      onChange={() => setSubmittedWithoutChanges(false)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField label="Tienda" error={errors.store?.message}>
        <Input
          autoComplete="off"
          placeholder="Amazon, Shein, eBay…"
          css={fieldStyles}
          {...register('store')}
        />
      </AuthField>

      <AuthField
        label="Guía de seguimiento"
        error={errors.trackingNumber?.message}
        hint="El número de rastreo que te dio la tienda."
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
          rows={3}
          placeholder="Qué contiene el paquete"
          css={{ ...fieldStyles, height: 'auto', minH: 20, py: 2.5 }}
          {...register('description')}
        />
      </AuthField>

      <Grid templateColumns={{ base: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }} gap={4}>
        <AuthField
          label="Valor declarado (USD)"
          error={errors.declaredValueUsd?.message}
          hint="Lo que pagaste, sin símbolos. Ejemplo: 45,90"
        >
          <Input
            inputMode="decimal"
            autoComplete="off"
            css={fieldStyles}
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
            css={fieldStyles}
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

      {(genericError || submittedWithoutChanges) && (
        <Text role="alert" fontSize="sm" color="red.500">
          {submittedWithoutChanges
            ? NO_CHANGES_MESSAGE
            : isEdit
              ? UPDATE_PURCHASE_FAILED_MESSAGE
              : CREATE_PURCHASE_FAILED_MESSAGE}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button
          variant="outline"
          height={11}
          px={6}
          onClick={onCancel}
          disabled={savePurchase.isPending}
        >
          Volver
        </Button>
        <Button
          type="submit"
          loading={savePurchase.isPending}
          loadingText={isEdit ? 'Guardando' : 'Creando'}
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
        >
          {isEdit ? 'Guardar cambios' : 'Crear pre-alerta'}
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default PurchaseForm;
