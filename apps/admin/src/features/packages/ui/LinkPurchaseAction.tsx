import { Button } from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { Link2 } from 'lucide-react';

import { useActionDialog } from '@/shared/lib/use-action-dialog';
import ActionDialog from '@/shared/ui/ActionDialog';
import { toaster } from '@/shared/ui/toaster';

import type { PackageNoticeContent } from '../model/package-notice';
import LinkPurchasePanel from './LinkPurchasePanel';

interface LinkPurchaseActionProps {
  packageId: string;
  warehouseNumber: string;
  customer: CustomerSummary | null;
  fallbackFocus: () => HTMLElement | null;
  onStale: (notice: PackageNoticeContent) => void;
}

function LinkPurchaseAction({
  packageId,
  warehouseNumber,
  customer,
  fallbackFocus,
  onStale,
}: LinkPurchaseActionProps) {
  const dialog = useActionDialog(fallbackFocus);

  function handleLinked() {
    dialog.hide();
    toaster.create({ type: 'success', title: 'Compra vinculada.', closable: true });
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
        <Link2 size={16} aria-hidden="true" />
        Vincular compra
      </Button>
      <ActionDialog
        open={dialog.open}
        title="Vincular compra"
        description={`Elige la pre-alerta que corresponde al paquete ${warehouseNumber}.`}
        finalFocusEl={dialog.finalFocusEl}
        onClose={dialog.hide}
      >
        <LinkPurchasePanel
          packageId={packageId}
          customer={customer}
          onLinked={handleLinked}
          onCancel={dialog.hide}
          onStale={handleStale}
        />
      </ActionDialog>
    </>
  );
}

export default LinkPurchaseAction;
