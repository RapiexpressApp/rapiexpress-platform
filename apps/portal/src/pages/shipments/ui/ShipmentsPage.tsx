import { Button, Stack, Text } from '@chakra-ui/react';
import { visiblePackageStatusSchema } from '@rapiexpress/api-client/tracking.schemas';
import { pressable } from '@rapiexpress/ui/interaction';
import ListPagination from '@rapiexpress/ui/list-pagination';
import ListStatus from '@rapiexpress/ui/list-status';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router';

import { LOAD_SHIPMENTS_FAILED_MESSAGE } from '@/features/shipments/model/shipment-errors';
import { useMyPackages } from '@/features/shipments/model/use-my-packages';
import PackageStatusFilter from '@/features/shipments/ui/PackageStatusFilter';
import ShipmentsList from '@/features/shipments/ui/ShipmentsList';
import { useListParams } from '@/shared/lib/use-list-params';
import { NEW_PRE_ALERT_PATH } from '@/shared/model/paths';

function ShipmentsPage() {
  const { page, pageSize, searchParams, setPage, update } = useListParams();
  const status = visiblePackageStatusSchema.safeParse(searchParams.get('status')).data ?? null;
  const packages = useMyPackages({ page, pageSize, ...(status ? { status } : {}) });

  useEffect(() => {
    document.title = 'Mis envíos · Rapiexpress';
  }, []);

  const items = packages.data?.items ?? [];
  const lastPage = Math.max(1, Math.ceil((packages.data?.total ?? 0) / pageSize));
  const outOfRange =
    packages.data !== undefined &&
    !packages.isPlaceholderData &&
    items.length === 0 &&
    page > lastPage;

  useEffect(() => {
    if (outOfRange) update({ page: lastPage > 1 ? String(lastPage) : null }, { replace: true });
  }, [outOfRange, lastPage, update]);

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
          Mis envíos
        </Text>
        <Text maxW="lg" fontSize="md" color="slate.600">
          Sigue tus paquetes desde que llegan a Miami hasta que los retiras.
        </Text>
      </Stack>

      <PackageStatusFilter
        value={status}
        onChange={(next) => update({ status: next }, { resetPage: true })}
      />

      <ListStatus
        buttonSize="lg"
        isPending={packages.isPending || outOfRange}
        isError={packages.isError}
        isEmpty={items.length === 0}
        errorMessage={LOAD_SHIPMENTS_FAILED_MESSAGE}
        emptyMessage={
          status
            ? 'No tienes envíos con este estado.'
            : 'Aún no tienes envíos. Aparecerán aquí cuando recibamos tus paquetes en nuestra bodega de Miami.'
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
              Ver todos
            </Button>
          ) : (
            <Button
              asChild
              colorPalette="brand"
              height={11}
              px={5}
              fontSize="sm"
              fontWeight="semibold"
              borderRadius="lg"
              css={pressable}
            >
              <Link to={NEW_PRE_ALERT_PATH}>
                <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
                Pre-alertar una compra
              </Link>
            </Button>
          )
        }
        onRetry={() => void packages.refetch()}
      >
        <Stack gap={4}>
          <ShipmentsList packages={items} />
          {packages.data && (
            <ListPagination
              buttonSize="lg"
              page={packages.data.page}
              pageSize={packages.data.pageSize}
              total={packages.data.total}
              itemCount={items.length}
              onPageChange={setPage}
            />
          )}
        </Stack>
      </ListStatus>
    </Stack>
  );
}

export default ShipmentsPage;
