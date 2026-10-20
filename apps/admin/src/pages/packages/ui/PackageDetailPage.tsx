import { Button, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react';
import { uuidSchema } from '@rapiexpress/api-client/field-schemas';
import type { PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';

import { isPackageEditable } from '@/features/packages/model/edit-package-values';
import {
  isPackageNotFound,
  LOAD_PACKAGE_FAILED_MESSAGE,
} from '@/features/packages/model/package-errors';
import type { PackageNoticeContent } from '@/features/packages/model/package-notice';
import { usePackage } from '@/features/packages/model/use-package';
import { useRefreshPackages } from '@/features/packages/model/use-refresh-packages';
import AssignCustomerAction from '@/features/packages/ui/AssignCustomerAction';
import EditPackageAction from '@/features/packages/ui/EditPackageAction';
import OpenIncidentAction from '@/features/packages/ui/OpenIncidentAction';
import OpenIncidentFlag from '@/features/packages/ui/OpenIncidentFlag';
import PackageCustomerSection from '@/features/packages/ui/PackageCustomerSection';
import PackageDataSection from '@/features/packages/ui/PackageDataSection';
import PackageHistorySection from '@/features/packages/ui/PackageHistorySection';
import PackageIncidentsSection from '@/features/packages/ui/PackageIncidentsSection';
import PackageNotice from '@/features/packages/ui/PackageNotice';
import PackagePurchaseSection from '@/features/packages/ui/PackagePurchaseSection';
import PackageStatusBadge from '@/features/packages/ui/PackageStatusBadge';
import ResolveIncidentAction from '@/features/packages/ui/ResolveIncidentAction';
import TransitionActions from '@/features/packages/ui/TransitionActions';
import { PACKAGES_PATH } from '@/shared/model/paths';

function BackToPackages() {
  return (
    <Flex
      asChild
      align="center"
      alignSelf="flex-start"
      gap={2}
      minH={11}
      px={3}
      ml={-3}
      borderRadius="lg"
      fontSize="sm"
      fontWeight="semibold"
      color="brand.700"
      touchAction="manipulation"
      _hover={{ bg: 'brand.50' }}
      _focusVisible={focusRing}
    >
      <Link to={PACKAGES_PATH}>
        <ArrowLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        Paquetes
      </Link>
    </Flex>
  );
}

function PackageDetail({ detail }: { detail: PackageStaffDetail }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const incidentsHeadingRef = useRef<HTMLHeadingElement>(null);
  const [notice, setNotice] = useState<PackageNoticeContent | null>(null);
  const refresh = useRefreshPackages();

  function handleStale(next: PackageNoticeContent) {
    setNotice(next);
    void refresh();
  }

  const fallbackFocus = () => headingRef.current;
  const incidentsFocus = () => incidentsHeadingRef.current;

  function showIncidents() {
    incidentsHeadingRef.current?.focus();
    incidentsHeadingRef.current?.scrollIntoView?.({ block: 'start' });
  }

  return (
    <Stack gap={6}>
      <BackToPackages />

      <Stack as="header" gap={2}>
        <Heading
          ref={headingRef}
          tabIndex={-1}
          outline="none"
          as="h1"
          size="2xl"
          letterSpacing="tight"
          fontVariantNumeric="tabular-nums"
          color="slate.900"
        >
          {detail.warehouseNumber}
        </Heading>
        <Text color="slate.600" fontVariantNumeric="tabular-nums">
          Guía {detail.trackingNumber}
        </Text>
        <Flex align="center" gap={2} wrap="wrap">
          <PackageStatusBadge status={detail.status} />
          {detail.openIncident && <OpenIncidentFlag />}
        </Flex>
        <TransitionActions
          detail={detail}
          fallbackFocus={fallbackFocus}
          onStale={handleStale}
          onShowIncidents={showIncidents}
        />
      </Stack>

      {notice && (
        <PackageNotice
          notice={notice}
          onDismiss={() => setNotice(null)}
          onShowIncidents={showIncidents}
        />
      )}

      <PackageDataSection
        detail={detail}
        action={
          isPackageEditable(detail.status) && (
            <EditPackageAction
              detail={detail}
              fallbackFocus={fallbackFocus}
              onStale={handleStale}
            />
          )
        }
      />
      <PackageCustomerSection
        customer={detail.customer}
        action={
          detail.customer === null && (
            <AssignCustomerAction
              packageId={detail.id}
              warehouseNumber={detail.warehouseNumber}
              fallbackFocus={fallbackFocus}
              onStale={handleStale}
            />
          )
        }
      />
      <PackagePurchaseSection purchase={detail.purchase} />
      <PackageIncidentsSection
        openIncident={detail.openIncident}
        incidents={detail.incidents}
        headingRef={incidentsHeadingRef}
        action={
          detail.openIncident === null && (
            <OpenIncidentAction
              packageId={detail.id}
              fallbackFocus={incidentsFocus}
              onStale={handleStale}
            />
          )
        }
        resolveAction={
          detail.openIncident && (
            <ResolveIncidentAction
              packageId={detail.id}
              incident={detail.openIncident}
              fallbackFocus={incidentsFocus}
              onStale={handleStale}
            />
          )
        }
      />
      <PackageHistorySection events={detail.events} />
    </Stack>
  );
}

function PackageDetailSkeleton() {
  return (
    <Stack role="status" aria-label="Cargando paquete" gap={6}>
      <Skeleton h={6} w={28} />
      <Stack gap={3}>
        <Skeleton h={10} w="40%" />
        <Skeleton h={5} w="55%" />
      </Stack>
      <Skeleton h={48} borderRadius="lg" />
      <Skeleton h={24} borderRadius="lg" />
    </Stack>
  );
}

function PackageNotFound() {
  return (
    <Stack gap={6}>
      <BackToPackages />
      <Flex direction="column" align="center" gap={3} py={12} textAlign="center">
        <Flex
          aria-hidden="true"
          align="center"
          justify="center"
          boxSize={12}
          borderRadius="full"
          bg="brand.50"
          color="brand.600"
        >
          <PackageOpen size={24} />
        </Flex>
        <Heading as="h1" size="xl" color="slate.900">
          No encontramos este paquete
        </Heading>
        <Text maxW="md" color="slate.600">
          Revisa que el enlace sea correcto o búscalo en el listado de paquetes.
        </Text>
        <Button asChild colorPalette="brand" mt={2} height={11} px={5}>
          <Link to={PACKAGES_PATH}>Ver paquetes</Link>
        </Button>
      </Flex>
    </Stack>
  );
}

function PackageLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Stack gap={6}>
      <BackToPackages />
      <Flex role="alert" direction="column" align="center" gap={3} py={12}>
        <Text color="slate.700">{LOAD_PACKAGE_FAILED_MESSAGE}</Text>
        <Button variant="outline" height={11} px={5} onClick={onRetry}>
          Reintentar
        </Button>
      </Flex>
    </Stack>
  );
}

function PackageDetailPage() {
  const { id = '' } = useParams();
  const validId = uuidSchema.safeParse(id).success;
  const pkg = usePackage(validId ? id : undefined);
  const notFound = !validId || (pkg.isError && isPackageNotFound(pkg.error));
  const title = pkg.data
    ? `Paquete ${pkg.data.warehouseNumber}`
    : notFound
      ? 'Paquete no encontrado'
      : 'Paquete';

  useEffect(() => {
    document.title = `${title} · Rapiexpress`;
  }, [title]);

  if (notFound) return <PackageNotFound />;
  if (pkg.data) return <PackageDetail detail={pkg.data} />;
  if (pkg.isError) return <PackageLoadError onRetry={() => void pkg.refetch()} />;
  return <PackageDetailSkeleton />;
}

export default PackageDetailPage;
