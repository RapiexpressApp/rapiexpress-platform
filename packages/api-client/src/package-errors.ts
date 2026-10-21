import { isAxiosError } from 'axios';
import * as z from 'zod';

import { getApiErrorCode } from './http-error.ts';
import {
  type ExistingPackage,
  existingPackageSchema,
  packageStatusSchema,
} from './packages.schemas.ts';

const DUPLICATE_TRACKING_NUMBER = 'DUPLICATE_TRACKING_NUMBER';
const INVALID_TRANSITION = 'INVALID_TRANSITION';

const duplicateTrackingNumberBodySchema = z.object({
  existingPackages: z.array(existingPackageSchema),
});

const invalidTransitionBodySchema = z.object({
  from: packageStatusSchema,
  to: packageStatusSchema,
  allowed: z.array(packageStatusSchema),
});

export type InvalidTransition = z.infer<typeof invalidTransitionBodySchema>;

export function getExistingPackages(error: unknown): ExistingPackage[] | undefined {
  if (!isAxiosError(error) || getApiErrorCode(error) !== DUPLICATE_TRACKING_NUMBER) {
    return undefined;
  }
  const body = duplicateTrackingNumberBodySchema.safeParse(error.response?.data);
  return body.success ? body.data.existingPackages : undefined;
}

export function getInvalidTransition(error: unknown): InvalidTransition | undefined {
  if (!isAxiosError(error) || getApiErrorCode(error) !== INVALID_TRANSITION) return undefined;
  const body = invalidTransitionBodySchema.safeParse(error.response?.data);
  return body.success ? body.data : undefined;
}
