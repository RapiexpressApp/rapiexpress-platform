import { useState } from 'react';

// ListSearchInput keeps its own draft, so it only shows an emptied URL search after a remount.
export function useSearchInputReset(search: string) {
  const [remounts, setRemounts] = useState(0);
  const [waiting, setWaiting] = useState(false);

  if (waiting && search === '') {
    setWaiting(false);
    setRemounts((count) => count + 1);
  }

  return { key: remounts, reset: () => setWaiting(true) };
}
