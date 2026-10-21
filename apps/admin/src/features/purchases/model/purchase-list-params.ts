import {
  type PurchaseStatus,
  purchaseStatusSchema,
  type StaffPurchaseListParams,
} from '@rapiexpress/api-client/purchases.schemas';

interface ListPosition {
  page: number;
  pageSize: number;
  search: string;
}

export function parsePurchaseStatus(searchParams: URLSearchParams): PurchaseStatus | null {
  return purchaseStatusSchema.safeParse(searchParams.get('status')).data ?? null;
}

export function buildPurchaseListParams(
  { page, pageSize, search }: ListPosition,
  status: PurchaseStatus | null
): StaffPurchaseListParams {
  return {
    page,
    pageSize,
    ...(search && { search }),
    ...(status && { status }),
  };
}
