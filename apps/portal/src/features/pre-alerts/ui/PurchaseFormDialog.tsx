import { Button, Dialog, Portal } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';

import PurchaseForm from './PurchaseForm';

interface PurchaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function PurchaseFormDialog({ open, onClose, onSaved }: PurchaseFormDialogProps) {
  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
      closeOnInteractOutside={false}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={4}>
            <Dialog.Header pe={16}>
              <Dialog.Title>Nueva pre-alerta</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description mb={4} color="slate.600">
                Cuéntanos qué compraste para registrarla en cuanto llegue a Miami.
              </Dialog.Description>
              <PurchaseForm onSaved={onSaved} onCancel={onClose} />
            </Dialog.Body>
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

export default PurchaseFormDialog;
