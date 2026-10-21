import type {
  OpenIncidentPayload,
  PackageStatus,
  ResolveIncidentPayload,
  UpdatePackagePayload,
} from '@rapiexpress/api-client/packages.schemas';
import { useMutation } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

import { useRefreshPackages } from './use-refresh-packages';
import { useRefreshPurchases } from './use-refresh-purchases';

export function useUpdatePackage(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: (payload: UpdatePackagePayload) => packagesApi.update(id, payload),
    onSuccess: refresh,
  });
}

export function useTransitionPackage(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: (to: PackageStatus) => packagesApi.transition(id, to),
    onSuccess: refresh,
  });
}

export function useOpenIncident(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: (payload: OpenIncidentPayload) => packagesApi.openIncident(id, payload),
    onSuccess: refresh,
  });
}

interface ResolveIncidentVariables {
  incidentId: string;
  payload: ResolveIncidentPayload;
}

export function useResolveIncident(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: ({ incidentId, payload }: ResolveIncidentVariables) =>
      packagesApi.resolveIncident(id, incidentId, payload),
    onSuccess: refresh,
  });
}

export function useAssignCustomer(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: (customerId: string) => packagesApi.assignCustomer(id, customerId),
    onSuccess: refresh,
  });
}

export function useLinkPurchase(id: string) {
  const refreshPackages = useRefreshPackages();
  const refreshPurchases = useRefreshPurchases();

  return useMutation({
    mutationFn: (purchaseId: string) => packagesApi.linkPurchase(id, purchaseId),
    onSuccess: () => Promise.all([refreshPackages(), refreshPurchases()]),
  });
}
