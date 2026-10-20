import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';

export function formatCustomer(customer: CustomerSummary | null): string {
  if (customer === null) return 'Cliente sin datos';
  return `${customer.name} ${customer.lastName} · ${customer.lockerCode ?? 'Sin casillero'}`;
}
