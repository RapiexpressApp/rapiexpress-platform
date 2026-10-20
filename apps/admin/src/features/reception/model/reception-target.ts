import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import type { ReceptionMatch } from '@rapiexpress/api-client/packages.schemas';

export type ReceptionTarget =
  | { kind: 'purchase'; match: ReceptionMatch }
  | { kind: 'customer'; customer: CustomerSummary }
  | { kind: 'unassigned' };

export function getTargetCustomer(target: ReceptionTarget): CustomerSummary | null {
  if (target.kind === 'purchase') return target.match.customer;
  if (target.kind === 'customer') return target.customer;
  return null;
}
