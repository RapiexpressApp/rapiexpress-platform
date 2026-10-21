import type { Purchase } from '@rapiexpress/api-client/purchases.schemas';

import type { PurchaseFormValues } from '../validation/purchase.validation';
import { getPurchaseChanges } from './purchase-form-values';
import { useCreatePurchase } from './use-create-purchase';
import { useUpdatePurchase } from './use-update-purchase';

interface SaveCallbacks {
  onSuccess: () => void;
  onError: (error: unknown) => void;
}

export function useSavePurchase(purchase: Purchase | undefined) {
  const create = useCreatePurchase();
  const update = useUpdatePurchase();
  const active = purchase ? update : create;

  function hasChanges(values: PurchaseFormValues): boolean {
    return !purchase || Object.keys(getPurchaseChanges(purchase, values)).length > 0;
  }

  function save(values: PurchaseFormValues, callbacks: SaveCallbacks) {
    if (purchase) {
      update.mutate({ id: purchase.id, payload: getPurchaseChanges(purchase, values) }, callbacks);
    } else {
      create.mutate(values, callbacks);
    }
  }

  return {
    save,
    hasChanges,
    isPending: active.isPending,
    isError: active.isError,
    error: active.error,
  };
}
