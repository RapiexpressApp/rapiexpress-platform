import type { ApiClient } from './client.ts';
import { toListQuery } from './pagination.ts';
import {
  type CreatePurchaseForCustomerPayload,
  createPurchaseForCustomerPayloadSchema,
  type CreatePurchasePayload,
  createPurchasePayloadSchema,
  type MyPurchaseListParams,
  type Purchase,
  type PurchaseList,
  purchaseListSchema,
  purchaseSchema,
  type StaffPurchaseList,
  type StaffPurchaseListParams,
  staffPurchaseListSchema,
  type UpdatePurchasePayload,
  updatePurchasePayloadSchema,
} from './purchases.schemas.ts';

export function createMyPurchasesApi({ apiClient }: ApiClient) {
  return {
    async list({ page, pageSize, status }: MyPurchaseListParams): Promise<PurchaseList> {
      const { data } = await apiClient.get('/me/purchases', {
        params: { page, pageSize, ...(status ? { status } : {}) },
      });
      return purchaseListSchema.parse(data);
    },

    async get(id: string): Promise<Purchase> {
      const { data } = await apiClient.get(`/me/purchases/${id}`);
      return purchaseSchema.parse(data);
    },

    async create(payload: CreatePurchasePayload): Promise<Purchase> {
      const body = createPurchasePayloadSchema.parse(payload);
      const { data } = await apiClient.post('/me/purchases', body);
      return purchaseSchema.parse(data);
    },

    async update(id: string, payload: UpdatePurchasePayload): Promise<Purchase> {
      const body = updatePurchasePayloadSchema.parse(payload);
      const { data } = await apiClient.patch(`/me/purchases/${id}`, body);
      return purchaseSchema.parse(data);
    },

    async cancel(id: string): Promise<Purchase> {
      const { data } = await apiClient.post(`/me/purchases/${id}/cancel`);
      return purchaseSchema.parse(data);
    },
  };
}

export type MyPurchasesApi = ReturnType<typeof createMyPurchasesApi>;

export function createPurchasesApi({ apiClient }: ApiClient) {
  return {
    async list({ status, ...params }: StaffPurchaseListParams): Promise<StaffPurchaseList> {
      const { data } = await apiClient.get('/purchases', {
        params: { ...toListQuery(params), ...(status ? { status } : {}) },
      });
      return staffPurchaseListSchema.parse(data);
    },

    async create(payload: CreatePurchaseForCustomerPayload): Promise<Purchase> {
      const body = createPurchaseForCustomerPayloadSchema.parse(payload);
      const { data } = await apiClient.post('/purchases', body);
      return purchaseSchema.parse(data);
    },
  };
}

export type PurchasesApi = ReturnType<typeof createPurchasesApi>;
