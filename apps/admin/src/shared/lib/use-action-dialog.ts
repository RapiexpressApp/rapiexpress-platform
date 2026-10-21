import { useRef, useState } from 'react';

interface DialogState<T> {
  target: T;
  open: boolean;
}

export function useActionDialog<T = undefined>(fallbackFocus: () => HTMLElement | null) {
  const [state, setState] = useState<DialogState<T> | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  function show(target: T, opener?: HTMLElement) {
    trigger.current = opener ?? null;
    setState({ target, open: true });
  }

  function hide() {
    setState((current) => current && { ...current, open: false });
  }

  function finalFocusEl(): HTMLElement | null {
    return trigger.current?.isConnected ? trigger.current : fallbackFocus();
  }

  return { target: state?.target, open: state?.open ?? false, show, hide, finalFocusEl };
}
