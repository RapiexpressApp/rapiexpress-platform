import { Button } from '@chakra-ui/react';
import { TriangleAlert } from 'lucide-react';

import { toaster } from '@/shared/ui/toaster';

import type { PackageNoticeContent } from '../model/package-notice';
import { useActionDialog } from '../model/use-action-dialog';
import ActionDialog from './ActionDialog';
import OpenIncidentForm from './OpenIncidentForm';

interface OpenIncidentActionProps {
  packageId: string;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
}

function OpenIncidentAction({ packageId, fallbackFocus, onStale }: OpenIncidentActionProps) {
  const dialog = useActionDialog(fallbackFocus);

  function handleOpened() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Incidencia abierta.', closable: true });
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
        <TriangleAlert size={16} aria-hidden="true" />
        Abrir incidencia
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Abrir incidencia"
        description="Mientras haya una incidencia abierta no se puede cambiar el estado del paquete."
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <OpenIncidentForm
          packageId={packageId}
          onOpened={handleOpened}
          onCancel={dialog.hide}
          onStale={handleStale}
        />
      </ActionDialog>
    </>
  );
}

export default OpenIncidentAction;
