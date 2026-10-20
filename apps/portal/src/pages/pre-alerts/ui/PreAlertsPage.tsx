import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { type Purchase, purchaseStatusSchema } from '@rapiexpress/api-client/purchases.schemas';
import { pressable } from '@rapiexpress/ui/interaction';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListStatus from '@rapiexpress/ui/list-status';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  LOAD_PURCHASES_FAILED_MESSAGE,
  PURCHASE_NOT_PENDING_MESSAGE,
} from '@/features/pre-alerts/model/pre-alert-errors';
import { useMyPurchases } from '@/features/pre-alerts/model/use-my-purchases';
import CancelPurchaseDialog from '@/features/pre-alerts/ui/CancelPurchaseDialog';
import PurchaseFormDialog from '@/features/pre-alerts/ui/PurchaseFormDialog';
import PurchasesList from '@/features/pre-alerts/ui/PurchasesList';
import PurchaseStatusFilter from '@/features/pre-alerts/ui/PurchaseStatusFilter';
import { useDialogTarget } from '@/shared/lib/use-dialog-target';
import { useListParams } from '@/shared/lib/use-list-params';

import PreAlertsNotice from './PreAlertsNotice';

const NEW_PARAM = 'new';

interface Notice {
  status: 'success' | 'warning';
  message: string;
}

function PreAlertsPage() {
  const { page, pageSize, searchParams, setPage, update } = useListParams();
  const [notice, setNotice] = useState<Notice | null>(null);
  const editDialog = useDialogTarget<Purchase>();
  const cancelDialog = useDialogTarget<Purchase>();
  const status = purchaseStatusSchema.safeParse(searchParams.get('status')).data ?? null;
  const purchases = useMyPurchases({ page, pageSize, ...(status ? { status } : {}) });
  const creating = searchParams.get(NEW_PARAM) === '1';

  useEffect(() => {
    document.title = 'Pre-alertas · Rapiexpress';
  }, []);

  const items = purchases.data?.items ?? [];
  const lastPage = Math.max(1, Math.ceil((purchases.data?.total ?? 0) / pageSize));
  const outOfRange =
    purchases.data !== undefined &&
    !purchases.isPlaceholderData &&
    items.length === 0 &&
    page > lastPage;

  useEffect(() => {
    if (outOfRange) update({ page: lastPage > 1 ? String(lastPage) : null }, { replace: true });
  }, [outOfRange, lastPage, update]);

  function openCreate() {
    setNotice(null);
    update({ [NEW_PARAM]: '1' });
  }

  function closeCreate() {
    update({ [NEW_PARAM]: null }, { replace: true });
  }

  function handleCreated() {
    update({ [NEW_PARAM]: null, status: null }, { resetPage: true, replace: true });
    setNotice({ status: 'success', message: 'Pre-alerta creada.' });
  }

  function openEdit(purchase: Purchase) {
    setNotice(null);
    editDialog.show(purchase);
  }

  function handleEdited() {
    editDialog.hide();
    setNotice({ status: 'success', message: 'Cambios guardados.' });
  }

  function handleNotPending() {
    editDialog.hide();
    cancelDialog.hide();
    setNotice({ status: 'warning', message: PURCHASE_NOT_PENDING_MESSAGE });
  }

  function openCancel(purchase: Purchase) {
    setNotice(null);
    cancelDialog.show(purchase);
  }

  function handleCancelled() {
    cancelDialog.hide();
    setNotice({ status: 'success', message: 'Pre-alerta cancelada.' });
  }

  return (
    <Stack gap={6}>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ sm: 'flex-end' }}
        justify="space-between"
        gap={4}
      >
        <Stack gap={2}>
          <Text
            as="h1"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="semibold"
            letterSpacing="tight"
            lineHeight="1.15"
            color="slate.900"
          >
            Pre-alertas
          </Text>
          <Text maxW="lg" fontSize="md" color="slate.600">
            Avísanos de tus compras antes de que lleguen a Miami para recibirlas más rápido.
          </Text>
        </Stack>
        <Button
          colorPalette="brand"
          height={11}
          px={5}
          fontSize="sm"
          fontWeight="semibold"
          borderRadius="lg"
          css={pressable}
          onClick={openCreate}
        >
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          Pre-alertar compra
        </Button>
      </Flex>

      {notice && (
        <PreAlertsNotice
          status={notice.status}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <PurchaseStatusFilter
        value={status}
        onChange={(next) => update({ status: next }, { resetPage: true })}
      />

      <ListStatus
        buttonSize="lg"
        isPending={purchases.isPending || outOfRange}
        isError={purchases.isError}
        isEmpty={items.length === 0}
        errorMessage={LOAD_PURCHASES_FAILED_MESSAGE}
        emptyMessage={
          status
            ? 'No tienes pre-alertas con este estado.'
            : 'Aún no tienes pre-alertas. Avísanos de tu próxima compra para recibirla más rápido.'
        }
        emptyAction={
          status ? (
            <Button
              variant="outline"
              height={11}
              px={5}
              fontSize="sm"
              fontWeight="semibold"
              borderRadius="lg"
              onClick={() => update({ status: null }, { resetPage: true })}
            >
              Ver todas
            </Button>
          ) : (
            <Button
              colorPalette="brand"
              height={11}
              px={5}
              fontSize="sm"
              fontWeight="semibold"
              borderRadius="lg"
              css={pressable}
              onClick={openCreate}
            >
              <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
              Pre-alertar mi primera compra
            </Button>
          )
        }
        onRetry={() => void purchases.refetch()}
      >
        <Stack gap={4}>
          <PurchasesList purchases={items} onEdit={openEdit} onCancel={openCancel} />
          {purchases.data && (
            <ListPagination
              buttonSize="lg"
              page={purchases.data.page}
              pageSize={purchases.data.pageSize}
              total={purchases.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>

      <PurchaseFormDialog open={creating} onClose={closeCreate} onSaved={handleCreated} />
      <PurchaseFormDialog
        open={editDialog.open}
        purchase={editDialog.target}
        onClose={editDialog.hide}
        onSaved={handleEdited}
        onNotPending={handleNotPending}
      />
      <CancelPurchaseDialog
        open={cancelDialog.open}
        purchase={cancelDialog.target}
        onClose={cancelDialog.hide}
        onCancelled={handleCancelled}
        onNotPending={handleNotPending}
      />
    </Stack>
  );
}

export default PreAlertsPage;
