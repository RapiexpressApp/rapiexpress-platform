import { Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';

import { useActionDialog } from '@/shared/lib/use-action-dialog';
import ActionDialog from '@/shared/ui/ActionDialog';
import { toaster } from '@/shared/ui/toaster';

import CreatePurchasePanel from './CreatePurchasePanel';

function CreatePurchaseAction() {
  const dialog = useActionDialog(() => null);

  function handleCreated() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Pre-alerta creada.', closable: true });
  }

  return (
    <>
      <Button
        colorPalette="brand"
        minH={11}
        onClick={(event) => dialog.show(undefined, event.currentTarget)}
      >
        <Plus size={18} aria-hidden="true" />
        Nueva pre-alerta
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Nueva pre-alerta"
        description="Registra una compra en nombre de un cliente."
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <CreatePurchasePanel onCreated={handleCreated} onCancel={dialog.hide} />
      </ActionDialog>
    </>
  );
}

export default CreatePurchaseAction;
