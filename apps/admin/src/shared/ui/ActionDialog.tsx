import { Button, Dialog, Portal } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';
import { type ReactNode, useState } from 'react';

import { DialogBusyContext } from '@/shared/lib/dialog-busy';

interface ActionDialogProps {
  open: boolean;
  title: string;
  description?: string;
  alert?: boolean;
  initialFocusEl?: () => HTMLElement | null;
  finalFocusEl?: () => HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
}

function ActionDialog({
  open,
  title,
  description,
  alert = false,
  initialFocusEl,
  finalFocusEl,
  onClose,
  children,
}: ActionDialogProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog.Root
      role={alert ? 'alertdialog' : 'dialog'}
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
      closeOnEscape={!busy}
      closeOnInteractOutside={false}
      initialFocusEl={initialFocusEl}
      finalFocusEl={finalFocusEl}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={4}>
            <Dialog.Header pe={16}>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {description && (
                <Dialog.Description mb={4} color="slate.600">
                  {description}
                </Dialog.Description>
              )}
              <DialogBusyContext value={setBusy}>{children}</DialogBusyContext>
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

export default ActionDialog;
