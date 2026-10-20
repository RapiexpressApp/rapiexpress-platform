import { Button, Stack, Text } from '@chakra-ui/react';
import { purchaseStatusSchema } from '@rapiexpress/api-client/purchases.schemas';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListStatus from '@rapiexpress/ui/list-status';
import { useEffect } from 'react';

import { useMyPurchases } from '@/features/pre-alerts/model/use-my-purchases';
import PurchasesList from '@/features/pre-alerts/ui/PurchasesList';
import PurchaseStatusFilter from '@/features/pre-alerts/ui/PurchaseStatusFilter';
import { useListParams } from '@/shared/lib/use-list-params';

function PreAlertsPage() {
  const { page, pageSize, searchParams, setPage, update } = useListParams();
  const status = purchaseStatusSchema.safeParse(searchParams.get('status')).data ?? null;
  const purchases = useMyPurchases({ page, pageSize, ...(status ? { status } : {}) });

  useEffect(() => {
    document.title = 'Pre-alertas · Rapiexpress';
  }, []);

  const items = purchases.data?.items ?? [];

  return (
    <Stack gap={6}>
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

      <PurchaseStatusFilter
        value={status}
        onChange={(next) => update({ status: next }, { resetPage: true })}
      />

      <ListStatus
        buttonSize="lg"
        isPending={purchases.isPending}
        isError={purchases.isError}
        isEmpty={items.length === 0}
        errorMessage="No pudimos cargar tus pre-alertas."
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
          ) : undefined
        }
        onRetry={() => void purchases.refetch()}
      >
        <Stack gap={4}>
          <PurchasesList purchases={items} />
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
    </Stack>
  );
}

export default PreAlertsPage;
