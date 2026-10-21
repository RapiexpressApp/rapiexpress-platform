import { Button, chakra, Flex, Grid, Input, NativeSelect, Text, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';
import { PACKAGE_TYPES, type PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useDialogBusy } from '@/shared/lib/dialog-busy';
import { useSingleFlight } from '@/shared/lib/use-single-flight';
import { CATEGORY_LABEL, PACKAGE_TYPE_LABEL } from '@/shared/model/package-labels';

import {
  findClearedFields,
  getPackageChanges,
  toEditFormValues,
} from '../model/edit-package-values';
import { classifyUpdateError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { useUpdatePackage } from '../model/use-package-mutations';
import {
  type EditPackageFormInput,
  editPackageFormSchema,
  type EditPackageFormValues,
} from '../validation/edit-package.validation';

interface EditPackageFormProps {
  detail: PackageStaffDetail;
  onSaved: () => void;
  onCancel: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

const NO_CHANGES_MESSAGE = 'Modifica al menos un campo para guardar los cambios.';
const CLEARED_MESSAGE = 'Este dato no se puede borrar. Escribe un valor nuevo.';

const fieldStyles = { ...inputStyles, px: 3.5 };
const numberStyles = { ...fieldStyles, fontVariantNumeric: 'tabular-nums' };
const textareaStyles = { ...fieldStyles, height: 'auto', minH: 20, py: 2.5 };

function EditPackageForm({ detail, onSaved, onCancel, onStale }: EditPackageFormProps) {
  const update = useSingleFlight(useUpdatePackage(detail.id));
  const [nothingChanged, setNothingChanged] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditPackageFormInput, unknown, EditPackageFormValues>({
    resolver: zodResolver(editPackageFormSchema),
    defaultValues: toEditFormValues(detail),
    mode: 'onSubmit',
  });
  useDialogBusy(update.isPending);

  function onSubmit(values: EditPackageFormValues) {
    const cleared = findClearedFields(detail, values);
    if (cleared.length > 0) {
      cleared.forEach((field, index) =>
        setError(field, { type: 'manual', message: CLEARED_MESSAGE }, { shouldFocus: index === 0 })
      );
      return;
    }

    const changes = getPackageChanges(detail, values);
    if (Object.keys(changes).length === 0) {
      setNothingChanged(true);
      return;
    }

    setNothingChanged(false);
    update.submit(changes, {
      onSuccess: onSaved,
      onError: (error) => {
        const failure = classifyUpdateError(error);
        if (failure.kind === 'stale') onStale(failure.notice);
      },
    });
  }

  const failure = update.isError ? classifyUpdateError(update.error) : null;
  const message = nothingChanged
    ? NO_CHANGES_MESSAGE
    : failure?.kind === 'inline'
      ? failure.message
      : null;

  return (
    <chakra.form
      noValidate
      aria-label="Editar datos del paquete"
      display="flex"
      flexDirection="column"
      gap={4}
      onChange={() => setNothingChanged(false)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        label="Peso (lb)"
        error={errors.weightLb?.message}
        hint="Lectura de la báscula. Ejemplo: 2,5"
      >
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
              {PACKAGE_TYPES.map((type) => (
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
              {detail.category === null && <option value="">Sin definir</option>}
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
        hint="Ejemplo: 45,90"
      >
        <Input
          inputMode="decimal"
          autoComplete="off"
          css={numberStyles}
          {...register('declaredValueUsd')}
        />
      </AuthField>

      <AuthField label="Descripción" error={errors.description?.message}>
        <Textarea rows={2} css={textareaStyles} {...register('description')} />
      </AuthField>

      <AuthField label="Notas" error={errors.notes?.message}>
        <Textarea rows={2} css={textareaStyles} {...register('notes')} />
      </AuthField>

      {message && (
        <Text role="alert" fontSize="sm" color="red.600">
          {message}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button variant="outline" height={11} px={6} disabled={update.isPending} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={update.isPending}
          loadingText="Guardando"
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
        >
          Guardar cambios
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default EditPackageForm;
