const PREFIX = 'portainer.';

function key(name: string) {
  return `${PREFIX}${name}`;
}

function getStoredValue<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key(name));
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function setStoredValue<T>(name: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  }
}

function removeStoredValue(...names: string[]) {
  if (typeof window !== 'undefined') {
    names.forEach((name) => window.localStorage.removeItem(key(name)));
  }
}

export const authStorage = {
  getLoginState: () => getStoredValue('LOGIN_STATE_UUID', ''),
  setLoginState: (value: string) => setStoredValue('LOGIN_STATE_UUID', value),
  clearLoginState: () => removeStoredValue('LOGIN_STATE_UUID'),
  getLogoutReason: () => getStoredValue('logout_reason', ''),
  setLogoutReason: (value: string) => setStoredValue('logout_reason', value),
  clearLogoutReason: () => removeStoredValue('logout_reason'),
  setUserId: (value: number) => setStoredValue('USER_ID', value),
  clear: () =>
    removeStoredValue(
      'USER_ID',
      'APPLICATION_STATE',
      'LOGIN_STATE_UUID',
      'ALLOWED_NAMESPACES',
      'ENDPOINT_STATE'
    ),
};
