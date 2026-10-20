import { Button, chakra, Flex, Grid, Input, NativeSelect, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';
import { PACKAGE_TYPES } from '@rapiexpress/api-client/packages.schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useForm } from 'react-hook-form';

import { formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL, PACKAGE_TYPE_LABEL } from '@/shared/model/package-labels';

import type { ReceptionTarget } from '../model/reception-target';
import {
  type ReceptionFormInput,
  receptionFormSchema,
  type ReceptionFormValues,
} from '../validation/reception-form.validation';
import TargetSummary from './TargetSummary';

interface ReceptionFormProps {
  target: ReceptionTarget;
  defaultValues: ReceptionFormInput;
  onSubmit: (input: ReceptionFormInput, values: ReceptionFormValues) => void;
  onCancel: () => void;
  onChangeTarget?: () => void;
}

const fieldStyles = { ...inputStyles, px: 3.5 };
const numberStyles = { ...fieldStyles, fontVariantNumeric: 'tabular-nums' };
const textareaStyles = { ...fieldStyles, height: 'auto', minH: 20, py: 2.5 };

function ReceptionForm({
  target,
  defaultValues,
  onSubmit,
  onCancel,
  onChangeTarget,
}: ReceptionFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ReceptionFormInput, unknown, ReceptionFormValues>({
    resolver: zodResolver(receptionFormSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const weightHint =
    target.kind === 'purchase'
      ? `Obligatorio. Lectura de la báscula. Peso estimado por el cliente: ${formatWeightLb(target.match.estimatedWeightLb)}.`
      : 'Obligatorio. Lectura de la báscula. Ejemplo: 2,5';

  return (
    <chakra.form
      noValidate
      display="flex"
      flexDirection="column"
      gap={5}
      onSubmit={handleSubmit((values) => onSubmit(getValues(), values))}
    >
      <TargetSummary target={target} onChange={onChangeTarget} />

      <AuthField label="Peso (lb)" error={errors.weightLb?.message} hint={weightHint}>
        <Input
          autoFocus
          inputMode="decimal"
          autoComplete="off"
          css={numberStyles}
          {...register('weightLb')}
        />
      </AuthField>

      <Grid templateColumns={{ base: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }} gap={4}>
        <AuthField label="Tipo de paquete" error={errors.packageType?.message}>
          <NativeSelect.Root>
            <NativeSelect.Field css={fieldStyles} {...register('packageType')}>
              <option value="">{PACKAGE_TYPE_LABEL.NORMAL} (predeterminado)</option>
              {PACKAGE_TYPES.filter((type) => type !== 'NORMAL').map((type) => (
                <option key={type} value={type}>
                  {PACKAGE_TYPE_LABEL[type]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </AuthField>

        <AuthField label="Categoría" error={errors.category?.message}>
          <NativeSelect.Root>
            <NativeSelect.Field css={fieldStyles} {...register('category')}>
              <option value="">Sin definir</option>
              {CUSTOMS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABEL[category]}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </AuthField>
      </Grid>

      <AuthField
        label="Valor declarado (USD)"
        error={errors.declaredValueUsd?.message}
        hint="Opcional. Ejemplo: 45,90"
      >
        <Input
          inputMode="decimal"
          autoComplete="off"
          css={numberStyles}
          {...register('declaredValueUsd')}
        />
      </AuthField>

      <AuthField label="Descripción" error={errors.description?.message} hint="Opcional.">
        <Textarea rows={2} css={textareaStyles} {...register('description')} />
      </AuthField>

      <AuthField
        label="Notas"
        error={errors.notes?.message}
        hint="Opcional. Daños visibles u observaciones del bulto."
      >
        <Textarea rows={2} css={textareaStyles} {...register('notes')} />
      </AuthField>

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap={3}>
        <Button variant="outline" height={11} px={6} onClick={onCancel}>
          Escanear otra guía
        </Button>
        <Button type="submit" {...submitButtonProps} width={{ base: 'full', sm: 'auto' }} px={6}>
          Revisar recepción
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default ReceptionForm;
