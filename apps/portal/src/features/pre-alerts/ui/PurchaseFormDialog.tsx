import { Button, Dialog, Portal } from '@chakra-ui/react';
import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { useState } from 'react';

import PurchaseForm from './PurchaseForm';

interface PurchaseFormDialogProps {
  open: boolean;
  purchase?: Purchase;
  onClose: () => void;
  onSaved: () => void;
  onNotPending?: () => void;
}

function PurchaseFormDialog({
  open,
  purchase,
  onClose,
  onSaved,
  onNotPending,
}: PurchaseFormDialogProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
      closeOnEscape={!busy}
      closeOnInteractOutside={false}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={4}>
            <Dialog.Header pe={16}>
              <Dialog.Title>{purchase ? 'Editar pre-alerta' : 'Nueva pre-alerta'}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description mb={4} color="slate.600">
                {purchase
                  ? 'Corrige los datos mientras la pre-alerta siga por recibir.'
                  : 'Cuéntanos qué compraste para registrarla en cuanto llegue a Miami.'}
              </Dialog.Description>
              <PurchaseForm
                purchase={purchase}
                onSaved={onSaved}
                onNotPending={onNotPending}
                onBusyChange={setBusy}
                onCancel={onClose}
              />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <Button
                aria-label="Cerrar"
                variant="ghost"
                disabled={busy}
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

export default PurchaseFormDialog;
