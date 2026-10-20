import type { ListParams } from './pagination.ts';
import type { MyPurchaseListParams } from './purchases.schemas.ts';
import type { MyPackageListParams } from './tracking.schemas.ts';

const authRoot = ['auth'] as const;
const usersRoot = ['users'] as const;
const customersRoot = ['customers'] as const;
const myPurchasesRoot = ['myPurchases'] as const;
const myPackagesRoot = ['myPackages'] as const;

export const queryKeys = {
  auth: {
    all: authRoot,
    me: () => [...authRoot, 'me'] as const,
  },
  users: {
    all: usersRoot,
    list: (params: ListParams) => [...usersRoot, 'list', params] as const,
  },
  customers: {
    all: customersRoot,
    list: (params: ListParams) => [...customersRoot, 'list', params] as const,
  },
  myPurchases: {
    all: myPurchasesRoot,
    list: (params: MyPurchaseListParams) => [...myPurchasesRoot, 'list', params] as const,
    detail: (id: string) => [...myPurchasesRoot, 'detail', id] as const,
  },
  myPackages: {
    all: myPackagesRoot,
    list: (params: MyPackageListParams) => [...myPackagesRoot, 'list', params] as const,
    detail: (id: string) => [...myPackagesRoot, 'detail', id] as const,
  },
};
