import { Button } from '@chakra-ui/react';
import type { PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';
import { Pencil } from 'lucide-react';

import { toaster } from '@/shared/ui/toaster';

import type { PackageNoticeContent } from '../model/package-notice';
import { useActionDialog } from '../model/use-action-dialog';
import ActionDialog from './ActionDialog';
import EditPackageForm from './EditPackageForm';

interface EditPackageActionProps {
  detail: PackageStaffDetail;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
}

function EditPackageAction({ detail, fallbackFocus, onStale }: EditPackageActionProps) {
  const dialog = useActionDialog(fallbackFocus);

  function handleSaved() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Datos del paquete actualizados.', closable: true });
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
        <Pencil size={16} aria-hidden="true" />
        Editar datos
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Editar datos del paquete"
        description="Corrige los datos mientras el paquete siga en la bodega."
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <EditPackageForm
          detail={detail}
          onSaved={handleSaved}
          onCancel={dialog.hide}
          onStale={handleStale}
        />
      </ActionDialog>
    </>
  );
}

export default EditPackageAction;
