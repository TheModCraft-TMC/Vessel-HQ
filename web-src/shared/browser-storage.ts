export function getBrowserLocalStorage() {
  return getBrowserStorage('localStorage');
}

export function getBrowserSessionStorage() {
  return getBrowserStorage('sessionStorage');
}

function getBrowserStorage(name: 'localStorage' | 'sessionStorage'): Storage {
  if (typeof window === 'undefined' || !window[name]) {
    // Zustand 4 treats a thrown storage lookup as persistence being unavailable.
    // Returning undefined instead reaches its hydration path and crashes on .bind().
    throw new Error(`${name} is unavailable outside the browser`);
  }

  return window[name];
}
