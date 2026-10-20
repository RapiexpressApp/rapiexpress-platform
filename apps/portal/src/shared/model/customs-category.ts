import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';

export type CustomsCategory = Purchase['suggestedCategory'];

export const CATEGORY_LABEL: Record<CustomsCategory, string> = {
  FOUR_BY_FOUR: '4x4',
  MIGRANT: 'G (migrante)',
  COMMERCIAL: 'C (comercial)',
};
