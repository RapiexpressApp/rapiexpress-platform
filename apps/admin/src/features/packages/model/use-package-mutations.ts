import type {
  OpenIncidentPayload,
  PackageStatus,
  ResolveIncidentPayload,
  UpdatePackagePayload,
} from '@rapiexpress/api-client/packages.schemas';
import { useMutation } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

import { useRefreshPackages } from './use-refresh-packages';

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
