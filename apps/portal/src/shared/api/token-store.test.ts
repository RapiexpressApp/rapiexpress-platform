import { beforeEach, describe, expect, it } from 'vitest';

import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';

describe('token store', () => {
  beforeEach(() => clearAccessToken());

  it('starts empty', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('stores and clears the token in memory', () => {
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('never persists the token in web storage', () => {
    setAccessToken('abc');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
