import { Button, Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { type RefObject, useRef } from 'react';

import {
  CANCEL_PURCHASE_FAILED_MESSAGE,
  isPurchaseNotPendingError,
} from '../model/pre-alert-errors';
import { useCancelPurchase } from '../model/use-cancel-purchase';

interface CancelPurchaseDialogProps {
  open: boolean;
  purchase?: Purchase;
  onClose: () => void;
  onCancelled: () => void;
  onNotPending: () => void;
}

interface CancelPurchasePanelProps extends Omit<CancelPurchaseDialogProps, 'open' | 'purchase'> {
  purchase: Purchase;
  keepRef: RefObject<HTMLButtonElement | null>;
}

function CancelPurchasePanel({
  purchase,
  keepRef,
  onClose,
  onCancelled,
  onNotPending,
}: CancelPurchasePanelProps) {
  const cancelPurchase = useCancelPurchase();

  function handleConfirm() {
    if (cancelPurchase.isPending) return;
    cancelPurchase.mutate(purchase.id, {
      onSuccess: onCancelled,
      onError: (error) => {
        if (isPurchaseNotPendingError(error)) onNotPending();
      },
    });
  }

  const genericError = cancelPurchase.isError && !isPurchaseNotPendingError(cancelPurchase.error);

  return (
    <Dialog.Body display="flex" flexDirection="column" gap={4}>
      <Dialog.Description color="slate.600">
        {`¿Quieres cancelar la pre-alerta de ${purchase.store} con la guía ${purchase.trackingNumber}? Esta acción no se puede deshacer.`}
      </Dialog.Description>

      {genericError && (
        <Text role="alert" fontSize="sm" color="red.500">
          {CANCEL_PURCHASE_FAILED_MESSAGE}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3} mt={2}>
        <Button
          ref={keepRef}
          variant="outline"
          height={11}
          px={6}
          disabled={cancelPurchase.isPending}
          onClick={onClose}
        >
          Mantener pre-alerta
        </Button>
        <Button
          colorPalette="red"
          height={11}
          px={6}
          fontWeight="semibold"
          loading={cancelPurchase.isPending}
          loadingText="Cancelando"
          onClick={handleConfirm}
        >
          Cancelar pre-alerta
        </Button>
      </Flex>
    </Dialog.Body>
  );
}

function CancelPurchaseDialog({
  open,
  purchase,
  onClose,
  onCancelled,
  onNotPending,
}: CancelPurchaseDialogProps) {
  const keepRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root
      role="alertdialog"
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
      initialFocusEl={() => keepRef.current}
      closeOnInteractOutside={false}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={4}>
            <Dialog.Header pe={16}>
              <Dialog.Title>Cancelar pre-alerta</Dialog.Title>
            </Dialog.Header>
            {purchase && (
              <CancelPurchasePanel
                purchase={purchase}
                keepRef={keepRef}
                onClose={onClose}
                onCancelled={onCancelled}
                onNotPending={onNotPending}
              />
            )}
            <Dialog.CloseTrigger asChild>
              <Button
                aria-label="Cerrar"
                variant="ghost"
                position="absolute"
                top={2}
                right={2}
                minW={11}
                height={11}
                fontSize="xl"
                color="slate.600"
                _focusVisible={focusRing}
              >
                ×
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default CancelPurchaseDialog;
