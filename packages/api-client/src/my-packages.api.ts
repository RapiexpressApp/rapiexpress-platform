import type { ApiClient } from './client.ts';
import {
  type MyPackageDetail,
  myPackageDetailSchema,
  type MyPackageList,
  type MyPackageListParams,
  myPackageListSchema,
} from './tracking.schemas.ts';

export function createMyPackagesApi({ apiClient }: ApiClient) {
  return {
    async list({ page, pageSize, status }: MyPackageListParams): Promise<MyPackageList> {
      const { data } = await apiClient.get('/me/packages', {
        params: { page, pageSize, ...(status ? { status } : {}) },
      });
      return myPackageListSchema.parse(data);
    },

    async get(id: string): Promise<MyPackageDetail> {
      const { data } = await apiClient.get(`/me/packages/${id}`);
      return myPackageDetailSchema.parse(data);
    },
  };
}

export type MyPackagesApi = ReturnType<typeof createMyPackagesApi>;
