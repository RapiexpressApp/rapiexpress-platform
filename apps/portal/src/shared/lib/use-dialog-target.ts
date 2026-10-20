import { useState } from 'react';

interface DialogState<T> {
  target: T;
  open: boolean;
}

export function useDialogTarget<T>() {
  const [state, setState] = useState<DialogState<T> | null>(null);

  function show(target: T) {
    setState({ target, open: true });
  }

  function hide() {
    setState((current) => current && { ...current, open: false });
  }

  return { target: state?.target, open: state?.open ?? false, show, hide };
}
