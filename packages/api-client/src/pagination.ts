import * as z from 'zod';

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  });
}

export function toListQuery({ page, pageSize, search }: ListParams) {
  const term = search?.trim();
  return { page, pageSize, ...(term ? { search: term } : {}) };
}
