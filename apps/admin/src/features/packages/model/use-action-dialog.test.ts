import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useActionDialog } from './use-action-dialog';

afterEach(() => {
  document.body.replaceChildren();
});

function setup() {
  const fallback = document.createElement('h1');
  const trigger = document.createElement('button');
  document.body.append(fallback, trigger);
  const hook = renderHook(() => useActionDialog<string>(() => fallback));
  return { ...hook, fallback, trigger };
}

describe('useActionDialog', () => {
  it('starts closed and without a target', () => {
    const { result } = setup();

    expect(result.current.open).toBe(false);
    expect(result.current.target).toBeUndefined();
  });

  it('opens with a target and keeps it while the dialog animates out', () => {
    const { result, trigger } = setup();

    act(() => result.current.show('SHIPPED', trigger));
    expect(result.current.open).toBe(true);
    expect(result.current.target).toBe('SHIPPED');

    act(() => result.current.hide());
    expect(result.current.open).toBe(false);
    expect(result.current.target).toBe('SHIPPED');
  });

  it('returns focus to the button that opened the dialog', () => {
    const { result, trigger } = setup();

    act(() => result.current.show('SHIPPED', trigger));

    expect(result.current.finalFocusEl()).toBe(trigger);
  });

  it('falls back to the page heading when that button is gone', () => {
    const { result, trigger, fallback } = setup();

    act(() => result.current.show('SHIPPED', trigger));
    trigger.remove();

    expect(result.current.finalFocusEl()).toBe(fallback);
  });

  it('falls back to the page heading when it never knew the button', () => {
    const { result, fallback } = setup();

    act(() => result.current.show('SHIPPED'));

    expect(result.current.finalFocusEl()).toBe(fallback);
  });
});
