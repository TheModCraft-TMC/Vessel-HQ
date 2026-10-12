import { get, set, keyBuilder } from '@/core/hooks/useLocalStorage';

const RETURN_URL_KEY = 'RETURN_URL';

export function storeReturnUrl(url: string): void {
  set(RETURN_URL_KEY, url);
}

export function getReturnUrl(): string | null {
  return get<string | null>(RETURN_URL_KEY, null);
}

export function cleanReturnUrl(): void {
  localStorage.removeItem(keyBuilder(RETURN_URL_KEY));
}
