import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

export function useCopyToClipboard(resetAfterMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timeoutRef = useRef<number | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      window.clearTimeout(timeoutRef.current);

      let next: CopyStatus = 'copied';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        next = 'failed';
      }

      if (!mountedRef.current) return;

      window.clearTimeout(timeoutRef.current);
      setStatus(next);
      timeoutRef.current = window.setTimeout(() => setStatus('idle'), resetAfterMs);
    },
    [resetAfterMs]
  );

  return { status, copy };
}
