import { Button } from '@chakra-ui/react';
import { UserPlus } from 'lucide-react';

import { toaster } from '@/shared/ui/toaster';

import type { PackageNoticeContent } from '../model/package-notice';
import { useActionDialog } from '../model/use-action-dialog';
import ActionDialog from './ActionDialog';
import AssignCustomerPanel from './AssignCustomerPanel';

interface AssignCustomerActionProps {
  packageId: string;
  warehouseNumber: string;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
}

function AssignCustomerAction({
  packageId,
  warehouseNumber,
  fallbackFocus,
  onStale,
}: AssignCustomerActionProps) {
  const dialog = useActionDialog(fallbackFocus);

  function handleAssigned() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Cliente asignado.', closable: true });
  }

  function handleStale(notice: PackageNoticeContent) {
    dialog.hide();
    onStale(notice);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={(event) => dialog.show(undefined, event.currentTarget)}
      >
        <UserPlus size={16} aria-hidden="true" />
        Asignar cliente
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Asignar cliente"
        description={`Busca al cliente que recibirá el paquete ${warehouseNumber}.`}
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <AssignCustomerPanel
          packageId={packageId}
          warehouseNumber={warehouseNumber}
          onAssigned={handleAssigned}
          onCancel={dialog.hide}
          onStale={handleStale}
        />
      </ActionDialog>
    </>
  );
}

export default AssignCustomerAction;
