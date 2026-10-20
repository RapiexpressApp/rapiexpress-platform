import type { ApiClient } from './client.ts';
import { trackingNumberSchema } from './field-schemas.ts';
import {
  assignCustomerPayloadSchema,
  linkPurchasePayloadSchema,
  type OpenIncidentPayload,
  openIncidentPayloadSchema,
  type PackageDetail,
  packageDetailSchema,
  type PackageIncident,
  packageIncidentSchema,
  type PackageList,
  type PackageListParams,
  packageListSchema,
  type PackageStaffDetail,
  packageStaffDetailSchema,
  type PackageStatus,
  type ReceivePackagePayload,
  receivePackagePayloadSchema,
  type ReceptionCustomers,
  receptionCustomerSearchSchema,
  receptionCustomersSchema,
  type ReceptionLookup,
  receptionLookupSchema,
  type ResolveIncidentPayload,
  resolveIncidentPayloadSchema,
  transitionPackagePayloadSchema,
  type UpdatePackagePayload,
  updatePackagePayloadSchema,
} from './packages.schemas.ts';
import { toListQuery } from './pagination.ts';

export function createPackagesApi({ apiClient }: ApiClient) {
  return {
    async lookup(trackingNumber: string): Promise<ReceptionLookup> {
      const { data } = await apiClient.get('/packages/reception/lookup', {
        params: { trackingNumber: trackingNumberSchema.parse(trackingNumber) },
      });
      return receptionLookupSchema.parse(data);
    },

    async searchReceptionCustomers(search: string): Promise<ReceptionCustomers> {
      const { data } = await apiClient.get('/packages/reception/customers', {
        params: { search: receptionCustomerSearchSchema.parse(search) },
      });
      return receptionCustomersSchema.parse(data);
    },

    async receive(payload: ReceivePackagePayload): Promise<PackageDetail> {
      const body = receivePackagePayloadSchema.parse(payload);
      const { data } = await apiClient.post('/packages', body);
      return packageDetailSchema.parse(data);
    },

    async list({
      status,
      unassigned,
      hasIncident,
      ...params
    }: PackageListParams): Promise<PackageList> {
      const { data } = await apiClient.get('/packages', {
        params: {
          ...toListQuery(params),
          ...(status ? { status } : {}),
          ...(unassigned === undefined ? {} : { unassigned }),
          ...(hasIncident === undefined ? {} : { hasIncident }),
        },
      });
      return packageListSchema.parse(data);
    },

    async get(id: string): Promise<PackageStaffDetail> {
      const { data } = await apiClient.get(`/packages/${id}`);
      return packageStaffDetailSchema.parse(data);
    },

    async update(id: string, payload: UpdatePackagePayload): Promise<PackageStaffDetail> {
      const body = updatePackagePayloadSchema.parse(payload);
      const { data } = await apiClient.patch(`/packages/${id}`, body);
      return packageStaffDetailSchema.parse(data);
    },

    async transition(id: string, to: PackageStatus): Promise<PackageStaffDetail> {
      const body = transitionPackagePayloadSchema.parse({ to });
      const { data } = await apiClient.post(`/packages/${id}/transitions`, body);
      return packageStaffDetailSchema.parse(data);
    },

    async openIncident(id: string, payload: OpenIncidentPayload): Promise<PackageIncident> {
      const body = openIncidentPayloadSchema.parse(payload);
      const { data } = await apiClient.post(`/packages/${id}/incidents`, body);
      return packageIncidentSchema.parse(data);
    },

    async resolveIncident(
      id: string,
      incidentId: string,
      payload: ResolveIncidentPayload = {}
    ): Promise<PackageIncident> {
      const body = resolveIncidentPayloadSchema.parse(payload);
      const { data } = await apiClient.post(
        `/packages/${id}/incidents/${incidentId}/resolve`,
        body
      );
      return packageIncidentSchema.parse(data);
    },

    async assignCustomer(id: string, customerId: string): Promise<PackageDetail> {
      const body = assignCustomerPayloadSchema.parse({ customerId });
      const { data } = await apiClient.post(`/packages/${id}/assign-customer`, body);
      return packageDetailSchema.parse(data);
    },

    async linkPurchase(id: string, purchaseId: string): Promise<PackageDetail> {
      const body = linkPurchasePayloadSchema.parse({ purchaseId });
      const { data } = await apiClient.post(`/packages/${id}/link-purchase`, body);
      return packageDetailSchema.parse(data);
    },
  };
}

export type PackagesApi = ReturnType<typeof createPackagesApi>;
