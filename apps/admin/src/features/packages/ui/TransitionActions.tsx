import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { PackageStaffDetail, PackageStatus } from '@rapiexpress/api-client/packages.schemas';
import { ArrowRight } from 'lucide-react';
import { useId } from 'react';

import { useActionDialog } from '@/shared/lib/use-action-dialog';
import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

import type { PackageNoticeContent } from '../model/package-notice';
import TransitionDialog from './TransitionDialog';

interface TransitionActionsProps {
  detail: PackageStaffDetail;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
  onShowIncidents: () => void;
}

function TransitionActions({
  detail,
  fallbackFocus,
  onStale,
  onShowIncidents,
}: TransitionActionsProps) {
  const dialog = useActionDialog<PackageStatus>(fallbackFocus);
  const reasonId = useId();
  const blocked = detail.openIncident !== null;

  if (detail.allowedTransitions.length === 0) {
    return (
      <Text fontSize="sm" color="slate.600">
        No hay cambios de estado manuales disponibles.
      </Text>
    );
  }

  return (
    <Stack gap={2}>
      <Flex role="group" aria-label="Cambiar estado" wrap="wrap" gap={2}>
        {detail.allowedTransitions.map((status) => (
          <Button
            key={status}
            colorPalette="brand"
            size="sm"
            disabled={blocked}
            aria-describedby={blocked ? reasonId : undefined}
            onClick={(event) => dialog.show(status, event.currentTarget)}
          >
            <ArrowRight size={16} aria-hidden="true" />
            {`Mover a ${PACKAGE_STATUS_LABEL[status]}`}
          </Button>
        ))}
      </Flex>
      {blocked && (
        <Flex align="center" gap={2} wrap="wrap" fontSize="sm" color="slate.700">
          <Text id={reasonId}>Resuelve la incidencia abierta para poder cambiar el estado.</Text>
          <Button variant="plain" size="sm" color="brand.700" onClick={onShowIncidents}>
            Ir a la incidencia
          </Button>
        </Flex>
      )}
      {dialog.target && (
        <TransitionDialog
          open={dialog.open}
          detail={detail}
          to={dialog.target}
          finalFocusEl={dialog.finalFocusEl}
          onClose={dialog.hide}
          onStale={onStale}
        />
      )}
    </Stack>
  );
}

export default TransitionActions;
