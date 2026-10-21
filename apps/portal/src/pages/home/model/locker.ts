import type { Locker } from './types';
import { WAREHOUSE_ADDRESS } from './warehouse-address';

interface LockerOwner {
  recipient: string;
  suite: string;
}

export function buildLocker({ recipient, suite }: LockerOwner): Locker {
  return { recipient, suite, ...WAREHOUSE_ADDRESS };
}

export function getLockerLines(locker: Locker): string[] {
  return [
    locker.recipient,
    `Suite ${locker.suite}`,
    locker.street,
    `${locker.city}, ${locker.state} ${locker.zip}`,
    locker.country,
    locker.phone,
  ];
}
