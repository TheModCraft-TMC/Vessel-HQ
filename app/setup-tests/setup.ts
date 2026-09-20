import '@testing-library/jest-dom/vitest';

// Node exposes an incomplete Storage global when started without a backing
// file. Replace it with a deterministic implementation so tests always use
// the same browser-compatible contract, independently of the Node version.
const localStorage = createMemoryStorage();
const sessionStorage = createMemoryStorage();

Object.defineProperties(globalThis, {
  localStorage: { configurable: true, value: localStorage },
  sessionStorage: { configurable: true, value: sessionStorage },
});

Object.defineProperties(window, {
  localStorage: { configurable: true, value: localStorage },
  sessionStorage: { configurable: true, value: sessionStorage },
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}
