import { createContext, useContext, useEffect } from 'react';

export const DialogBusyContext = createContext<(busy: boolean) => void>(() => {});

export function useDialogBusy(busy: boolean) {
  const setBusy = useContext(DialogBusyContext);

  useEffect(() => {
    setBusy(busy);
    return () => setBusy(false);
  }, [busy, setBusy]);
}
