import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import { getApiErrorCode } from '@rapiexpress/api-client/http-error';
import type { StaffPurchase } from '@rapiexpress/api-client/purchases.schemas';
import ListSearchInput from '@rapiexpress/ui/list-search-input';
import ListStatus from '@rapiexpress/ui/list-status';
import { useState } from 'react';

import { useSingleFlight } from '@/shared/lib/use-single-flight';

import { useDialogBusy } from '../model/dialog-busy';
import { classifyLinkError } from '../model/package-action-errors';
import type { PackageNoticeContent } from '../model/package-notice';
import { purchasesOfCustomer } from '../model/pending-purchases';
import { useLinkPurchase } from '../model/use-package-mutations';
import { PENDING_PURCHASES_PAGE_SIZE, usePendingPurchases } from '../model/use-pending-purchases';
import { useRefreshPurchases } from '../model/use-refresh-purchases';
import PurchaseOption from './PurchaseOption';

const CHOICE_ERROR_CODES: readonly string[] = [
  'PURCHASE_NOT_PENDING',
  'PURCHASE_NOT_FOUND',
  'CUSTOMER_PURCHASE_MISMATCH',
];

interface LinkPurchasePanelProps {
  packageId: string;
  customer: CustomerSummary | null;
  onLinked: () => void;
  onCancel: () => void;
  onStale: (notice: PackageNoticeContent) => void;
}

function emptyMessage(customer: CustomerSummary | null, search: string): string {
  if (search.trim()) return 'No encontramos pre-alertas por recibir con esa búsqueda.';
  return customer
    ? 'No hay pre-alertas por recibir de este cliente.'
    : 'No hay pre-alertas por recibir.';
}

function LinkPurchasePanel({
  packageId,
  customer,
  onLinked,
  onCancel,
  onStale,
}: LinkPurchasePanelProps) {
  const link = useSingleFlight(useLinkPurchase(packageId));
  const refreshPurchases = useRefreshPurchases();
  const [search, setSearch] = useState('');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const purchases = usePendingPurchases(customer, search);
  const items = purchasesOfCustomer(purchases.data?.items ?? [], customer);
  const chosen = items.find((purchase) => purchase.id === chosenId);
  const truncated = (purchases.data?.total ?? 0) > PENDING_PURCHASES_PAGE_SIZE;
  useDialogBusy(link.isPending);

  function handleChoose(purchase: StaffPurchase) {
    link.reset();
    setChosenId(purchase.id);
  }

  function handleLink() {
    if (!chosen) return;
    link.submit(chosen.id, {
      onSuccess: onLinked,
      onError: (error) => {
        const failure = classifyLinkError(error);
        if (failure.kind === 'stale') {
          onStale(failure.notice);
          return;
        }
        const code = getApiErrorCode(error);
        if (code !== undefined && CHOICE_ERROR_CODES.includes(code)) {
          setChosenId(null);
          void refreshPurchases();
        }
      },
    });
  }

  const failure = link.isError ? classifyLinkError(link.error) : null;

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="slate.600">
        {customer
          ? `Solo se muestran las pre-alertas de ${customer.name} ${customer.lastName}.`
          : 'El paquete no tiene cliente: tomará el de la pre-alerta que elijas.'}
      </Text>

      <ListSearchInput
        value={search}
        onSearch={setSearch}
        label="Buscar pre-alerta"
        placeholder="Guía, cliente o casillero"
      />

      <ListStatus
        isPending={purchases.isPending}
        isError={purchases.isError}
        isEmpty={items.length === 0}
        errorMessage="No pudimos cargar las pre-alertas."
        emptyMessage={emptyMessage(customer, search)}
        buttonSize="lg"
        onRetry={() => void purchases.refetch()}
      >
        <Stack
          as="ul"
          gap={2}
          p={1}
          maxH="min(18rem, 32dvh)"
          overflowY="auto"
          listStyleType="none"
          aria-label="Pre-alertas por recibir"
          aria-busy={purchases.isPlaceholderData}
          opacity={purchases.isPlaceholderData ? 0.6 : 1}
        >
          {items.map((purchase) => (
            <li key={purchase.id}>
              <PurchaseOption
                purchase={purchase}
                selected={purchase.id === chosen?.id}
                disabled={link.isPending}
                onChoose={handleChoose}
              />
            </li>
          ))}
        </Stack>
        {truncated && (
          <Text fontSize="sm" color="slate.600" mt={2}>
            Mostramos las primeras {PENDING_PURCHASES_PAGE_SIZE} pre-alertas. Escribe más para
            afinar la búsqueda.
          </Text>
        )}
      </ListStatus>

      {failure?.kind === 'inline' && (
        <Text role="alert" fontSize="sm" color="red.600">
          {failure.message}
        </Text>
      )}

      <Flex direction={{ base: 'column-reverse', sm: 'row' }} justify="flex-end" gap={3}>
        <Button variant="outline" height={11} px={6} disabled={link.isPending} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          colorPalette="brand"
          height={11}
          px={6}
          fontWeight="semibold"
          disabled={!chosen}
          loading={link.isPending}
          loadingText="Vinculando"
          onClick={handleLink}
        >
          Vincular compra
        </Button>
      </Flex>
    </Stack>
  );
}

export default LinkPurchasePanel;
