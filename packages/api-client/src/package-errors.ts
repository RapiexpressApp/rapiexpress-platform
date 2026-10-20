import { isAxiosError } from 'axios';
import * as z from 'zod';

import { getApiErrorCode } from './http-error.ts';
import { type ExistingPackage, existingPackageSchema } from './packages.schemas.ts';

const DUPLICATE_TRACKING_NUMBER = 'DUPLICATE_TRACKING_NUMBER';

const duplicateTrackingNumberBodySchema = z.object({
  existingPackages: z.array(existingPackageSchema),
});

export function getExistingPackages(error: unknown): ExistingPackage[] | undefined {
  if (!isAxiosError(error) || getApiErrorCode(error) !== DUPLICATE_TRACKING_NUMBER) {
    return undefined;
  }
  const body = duplicateTrackingNumberBodySchema.safeParse(error.response?.data);
  return body.success ? body.data.existingPackages : undefined;
}
