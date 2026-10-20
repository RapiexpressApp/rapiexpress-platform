import { Button, Flex, Text } from '@chakra-ui/react';
import type { PackageStaffDetail, PackageStatus } from '@rapiexpress/api-client/packages.schemas';
import { useRef } from 'react';

import { useSingleFlight } from '@/shared/lib/use-single-flight';
import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';
import { toaster } from '@/shared/ui/toaster';

import { useDialogBusy } from '../model/dialog-busy';
import { classifyTransitionError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { useTransitionPackage } from '../model/use-package-mutations';
import ActionDialog from './ActionDialog';

interface TransitionDialogProps {
  open: boolean;
  detail: PackageStaffDetail;
  to: PackageStatus;
  finalFocusEl: () => HTMLElement | null;
  onClose: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

interface TransitionPanelProps extends Omit<TransitionDialogProps, 'open' | 'finalFocusEl'> {
  keepRef: React.RefObject<HTMLButtonElement | null>;
}

function TransitionPanel({ detail, to, keepRef, onClose, onStale }: TransitionPanelProps) {
  const transition = useSingleFlight(useTransitionPackage(detail.id));
  useDialogBusy(transition.isPending);

  function handleConfirm() {
    transition.submit(to, {
      onSuccess: () => {
        onClose();
        toaster.create({
          type: 'success',
          title: 'Estado del paquete actualizado.',
          closable: true,
        });
      },
      onError: (error) => {
        const failure = classifyTransitionError(error);
        if (failure.kind === 'stale') {
          onClose();
          onStale(failure.notice);
        }
      },
    });
  }

  const failure = transition.isError ? classifyTransitionError(transition.error) : null;
  const label = PACKAGE_STATUS_LABEL[to];

  return (
    <Flex direction="column" gap={4}>
      {failure?.kind === 'inline' && (
        <Text role="alert" fontSize="sm" color="red.600">
          {failure.message}
        </Text>
      )}
      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button
          ref={keepRef}
          variant="outline"
          height={11}
          px={6}
          disabled={transition.isPending}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          colorPalette="brand"
          height={11}
          px={6}
          fontWeight="semibold"
          loading={transition.isPending}
          loadingText="Moviendo"
          onClick={handleConfirm}
        >
          {`Mover a ${label}`}
        </Button>
      </Flex>
    </Flex>
  );
}

function TransitionDialog({
  open,
  detail,
  to,
  finalFocusEl,
  onClose,
  onStale,
}: TransitionDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);
  const label = PACKAGE_STATUS_LABEL[to];

  return (
    <ActionDialog
      alert
      open={open}
      title={`Mover a ${label}`}
      description={`¿Mover el paquete ${detail.warehouseNumber} de «${PACKAGE_STATUS_LABEL[detail.status]}» a «${label}»? Quedará registrado en el historial del paquete.`}
      initialFocusEl={() => keepRef.current}
      finalFocusEl={finalFocusEl}
      onClose={onClose}
    >
      <TransitionPanel
        detail={detail}
        to={to}
        keepRef={keepRef}
        onClose={onClose}
        onStale={onStale}
      />
    </ActionDialog>
  );
}

export default TransitionDialog;
