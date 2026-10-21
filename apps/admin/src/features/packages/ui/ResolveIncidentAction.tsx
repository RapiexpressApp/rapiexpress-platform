import { Button } from '@chakra-ui/react';
import type { PackageIncident } from '@rapiexpress/api-client/packages.schemas';
import { CircleCheck } from 'lucide-react';

import { useActionDialog } from '@/shared/lib/use-action-dialog';
import { INCIDENT_TYPE_LABEL } from '@/shared/model/package-labels';
import ActionDialog from '@/shared/ui/ActionDialog';
import { toaster } from '@/shared/ui/toaster';

import type { PackageNoticeContent } from '../model/package-notice';
import ResolveIncidentForm from './ResolveIncidentForm';

interface ResolveIncidentActionProps {
  packageId: string;
  incident: PackageIncident;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
}

function ResolveIncidentAction({
  packageId,
  incident,
  fallbackFocus,
  onStale,
}: ResolveIncidentActionProps) {
  const dialog = useActionDialog(fallbackFocus);

  function handleResolved() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Incidencia resuelta.', closable: true });
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
        mt={2}
        onClick={(event) => dialog.show(undefined, event.currentTarget)}
      >
        <CircleCheck size={16} aria-hidden="true" />
        Resolver incidencia
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Resolver incidencia"
        description={`Se cerrará la incidencia «${INCIDENT_TYPE_LABEL[incident.type]}» y el paquete podrá cambiar de estado de nuevo.`}
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <ResolveIncidentForm
          packageId={packageId}
          incidentId={incident.id}
          onResolved={handleResolved}
          onCancel={dialog.hide}
          onStale={handleStale}
        />
      </ActionDialog>
    </>
  );
}

export default ResolveIncidentAction;
