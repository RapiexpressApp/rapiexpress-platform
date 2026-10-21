import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import type { StaffPurchase } from '@rapiexpress/api-client/purchases.schemas';

export const MAX_PURCHASE_SEARCH_LENGTH = 100;

export function pendingPurchasesSearch(customer: CustomerSummary | null, typed: string): string {
  const term = typed.trim().slice(0, MAX_PURCHASE_SEARCH_LENGTH);
  if (term) return term;
  if (!customer) return '';
  return customer.lockerCode ?? customer.name;
}

export function purchasesOfCustomer(
  purchases: StaffPurchase[],
  customer: CustomerSummary | null
): StaffPurchase[] {
  return customer
    ? purchases.filter((purchase) => purchase.customer.id === customer.id)
    : purchases;
}
