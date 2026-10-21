import { Button, chakra, Flex, Text, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useForm } from 'react-hook-form';

import { useDialogBusy } from '@/shared/lib/dialog-busy';
import { useSingleFlight } from '@/shared/lib/use-single-flight';

import { classifyResolveError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { useResolveIncident } from '../model/use-package-mutations';
import {
  type ResolveIncidentFormInput,
  resolveIncidentFormSchema,
  type ResolveIncidentFormValues,
} from '../validation/resolve-incident.validation';

interface ResolveIncidentFormProps {
  packageId: string;
  incidentId: string;
  onResolved: () => void;
  onCancel: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

const textareaStyles = { ...inputStyles, px: 3.5, height: 'auto', minH: 24, py: 2.5 };

function ResolveIncidentForm({
  packageId,
  incidentId,
  onResolved,
  onCancel,
  onStale,
}: ResolveIncidentFormProps) {
  const resolve = useSingleFlight(useResolveIncident(packageId));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResolveIncidentFormInput, unknown, ResolveIncidentFormValues>({
    resolver: zodResolver(resolveIncidentFormSchema),
    defaultValues: { resolutionNote: '' },
    mode: 'onSubmit',
  });
  useDialogBusy(resolve.isPending);

  function onSubmit(values: ResolveIncidentFormValues) {
    resolve.submit(
      {
        incidentId,
        payload: values.resolutionNote ? { resolutionNote: values.resolutionNote } : {},
      },
      {
        onSuccess: onResolved,
        onError: (error) => {
          const failure = classifyResolveError(error);
          if (failure.kind === 'stale') onStale(failure.notice);
        },
      }
    );
  }

  const failure = resolve.isError ? classifyResolveError(resolve.error) : null;

  return (
    <chakra.form
      noValidate
      aria-label="Resolver incidencia"
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField
        label="Nota de resolución (opcional)"
        error={errors.resolutionNote?.message}
        hint="Cómo se resolvió. Máximo 500 caracteres."
      >
        <Textarea rows={3} css={textareaStyles} {...register('resolutionNote')} />
      </AuthField>

      {failure?.kind === 'inline' && (
        <Text role="alert" fontSize="sm" color="red.600">
          {failure.message}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button
          variant="outline"
          height={11}
          px={6}
          disabled={resolve.isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={resolve.isPending}
          loadingText="Resolviendo"
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
        >
          Resolver incidencia
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default ResolveIncidentForm;
