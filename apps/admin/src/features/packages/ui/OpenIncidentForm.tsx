import { Button, chakra, Flex, NativeSelect, Text, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  INCIDENT_TYPES,
  type IncidentType,
  type OpenIncidentPayload,
  openIncidentPayloadSchema,
} from '@rapiexpress/api-client/packages.schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { useForm } from 'react-hook-form';

import { useDialogBusy } from '@/shared/lib/dialog-busy';
import { useSingleFlight } from '@/shared/lib/use-single-flight';
import { INCIDENT_TYPE_LABEL } from '@/shared/model/package-labels';

import { classifyOpenIncidentError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { useOpenIncident } from '../model/use-package-mutations';

interface OpenIncidentFormProps {
  packageId: string;
  onOpened: () => void;
  onCancel: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

const fieldStyles = { ...inputStyles, px: 3.5 };
const textareaStyles = { ...fieldStyles, height: 'auto', minH: 24, py: 2.5 };

function OpenIncidentForm({ packageId, onOpened, onCancel, onStale }: OpenIncidentFormProps) {
  const openIncident = useSingleFlight(useOpenIncident(packageId));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenIncidentPayload>({
    resolver: zodResolver(openIncidentPayloadSchema),
    defaultValues: { type: '' as IncidentType, reason: '' },
    mode: 'onSubmit',
  });
  useDialogBusy(openIncident.isPending);

  function onSubmit(payload: OpenIncidentPayload) {
    openIncident.submit(payload, {
      onSuccess: onOpened,
      onError: (error) => {
        const failure = classifyOpenIncidentError(error);
        if (failure.kind === 'stale') onStale(failure.notice);
      },
    });
  }

  const failure = openIncident.isError ? classifyOpenIncidentError(openIncident.error) : null;

  return (
    <chakra.form
      noValidate
      aria-label="Abrir incidencia"
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField label="Tipo de incidencia" error={errors.type?.message}>
        <NativeSelect.Root>
          <NativeSelect.Field css={fieldStyles} {...register('type')}>
            <option value="">Selecciona un tipo</option>
            {INCIDENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {INCIDENT_TYPE_LABEL[type]}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </AuthField>

      <AuthField
        label="Motivo"
        error={errors.reason?.message}
        hint="Qué ocurrió con el paquete. Máximo 500 caracteres."
      >
        <Textarea rows={3} css={textareaStyles} {...register('reason')} />
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
          disabled={openIncident.isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={openIncident.isPending}
          loadingText="Abriendo"
          {...submitButtonProps}
          width={{ base: 'full', sm: 'auto' }}
          px={6}
        >
          Abrir incidencia
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default OpenIncidentForm;
