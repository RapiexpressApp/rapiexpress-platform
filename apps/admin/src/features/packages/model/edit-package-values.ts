import type {
  PackageStaffDetail,
  PackageStatus,
  UpdatePackagePayload,
} from '@rapiexpress/api-client/packages.schemas';

import type {
  EditPackageFormInput,
  EditPackageFormValues,
} from '../validation/edit-package.validation';

// Mirrors EDITABLE_STATUSES in the backend state machine, which the API does not expose.
const EDITABLE_STATUSES: readonly PackageStatus[] = ['IN_WAREHOUSE', 'CONSOLIDATED', 'IN_BAG'];

export type ClearedField = 'declaredValueUsd' | 'description' | 'notes';

export function isPackageEditable(status: PackageStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

function toDecimalComma(value: string): string {
  return value.replace('.', ',');
}

export function toEditFormValues(detail: PackageStaffDetail): EditPackageFormInput {
  return {
    weightLb: toDecimalComma(String(detail.weightLb)),
    packageType: detail.packageType,
    category: detail.category ?? ('' as EditPackageFormInput['category']),
    declaredValueUsd:
      detail.declaredValueUsd === null ? '' : toDecimalComma(detail.declaredValueUsd.toFixed(2)),
    description: detail.description ?? '',
    notes: detail.notes ?? '',
  };
}

export function getPackageChanges(
  detail: PackageStaffDetail,
  values: EditPackageFormValues
): UpdatePackagePayload {
  return {
    ...(values.weightLb !== detail.weightLb && { weightLb: values.weightLb }),
    ...(values.packageType !== detail.packageType && { packageType: values.packageType }),
    ...(values.category !== undefined &&
      values.category !== detail.category && { category: values.category }),
    ...(values.declaredValueUsd !== undefined &&
      values.declaredValueUsd !== detail.declaredValueUsd && {
        declaredValueUsd: values.declaredValueUsd,
      }),
    ...(values.description !== undefined &&
      values.description !== detail.description && { description: values.description }),
    ...(values.notes !== undefined && values.notes !== detail.notes && { notes: values.notes }),
  };
}

export function findClearedFields(
  detail: PackageStaffDetail,
  values: EditPackageFormValues
): ClearedField[] {
  const cleared: ClearedField[] = [];
  if (values.declaredValueUsd === undefined && detail.declaredValueUsd !== null) {
    cleared.push('declaredValueUsd');
  }
  if (values.description === undefined && detail.description !== null) cleared.push('description');
  if (values.notes === undefined && detail.notes !== null) cleared.push('notes');
  return cleared;
}
