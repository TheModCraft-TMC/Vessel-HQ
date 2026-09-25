const PREFIX = 'portainer.';

function key(name: string) {
  return `${PREFIX}${name}`;
}

export function getStoredValue<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.localStorage.getItem(key(name));
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function setStoredValue<T>(name: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  }
}

export function removeStoredValue(...names: string[]) {
  if (typeof window !== 'undefined') {
    names.forEach((name) => window.localStorage.removeItem(key(name)));
  }
}
