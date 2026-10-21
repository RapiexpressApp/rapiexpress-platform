import {
  type PackageListParams,
  type PackageStatus,
  packageStatusSchema,
} from '@rapiexpress/api-client/packages.schemas';

export interface PackageFilters {
  status: PackageStatus | null;
  unassigned: boolean;
  hasIncident: boolean;
}

interface ListPosition {
  page: number;
  pageSize: number;
  search: string;
}

export function parsePackageFilters(searchParams: URLSearchParams): PackageFilters {
  return {
    status: packageStatusSchema.safeParse(searchParams.get('status')).data ?? null,
    unassigned: searchParams.get('unassigned') === 'true',
    hasIncident: searchParams.get('hasIncident') === 'true',
  };
}

export function buildPackageListParams(
  { page, pageSize, search }: ListPosition,
  { status, unassigned, hasIncident }: PackageFilters
): PackageListParams {
  return {
    page,
    pageSize,
    ...(search && { search }),
    ...(status && { status }),
    ...(unassigned && { unassigned: true }),
    ...(hasIncident && { hasIncident: true }),
  };
}

export function filtersToQuery(changes: Partial<PackageFilters>): Record<string, string | null> {
  const query: Record<string, string | null> = {};
  if ('status' in changes) query.status = changes.status ?? null;
  if ('unassigned' in changes) query.unassigned = changes.unassigned ? 'true' : null;
  if ('hasIncident' in changes) query.hasIncident = changes.hasIncident ? 'true' : null;
  return query;
}
