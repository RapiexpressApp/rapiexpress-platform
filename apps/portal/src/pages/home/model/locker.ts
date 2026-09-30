import type { Locker } from './types';

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
