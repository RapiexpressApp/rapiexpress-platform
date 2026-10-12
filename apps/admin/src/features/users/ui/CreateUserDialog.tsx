import { Button, Dialog, Portal } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { toaster } from '@/shared/ui/toaster';

import CreateUserForm from './CreateUserForm';

function CreateUserDialog() {
  const [open, setOpen] = useState(false);

  function handleCreated() {
    setOpen(false);
    toaster.create({ type: 'success', title: 'Usuario creado.', closable: true });
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={(event) => setOpen(event.open)}
      closeOnInteractOutside={false}
      placement="center"
      scrollBehavior="inside"
    >
      <Dialog.Trigger asChild>
        <Button colorPalette="brand">
          <Plus size={18} aria-hidden="true" />
          Crear usuario
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Crear usuario</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <CreateUserForm onCreated={handleCreated} onCancel={() => setOpen(false)} />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <Button
                aria-label="Cerrar"
                variant="ghost"
                size="sm"
                position="absolute"
                top={3}
                right={3}
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

export default CreateUserDialog;
