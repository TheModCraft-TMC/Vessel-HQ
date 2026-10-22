import { useEffect, useState } from 'react';

/** Follow the console's selected theme, including changes without remounting. */
export function useGraphTheme(): 'dark' | 'light' {
  function read(): 'dark' | 'light' {
    if (typeof document === 'undefined') return 'dark';
    const theme = document.documentElement.getAttribute('theme');
    if (theme === 'dark' || theme === 'highcontrast') return 'dark';
    if (theme === 'light') return 'light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  const [mode, setMode] = useState(read);
  useEffect(() => {
    function update() {
      setMode(read());
    }
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['theme'],
    });
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      media?.removeEventListener('change', update);
    };
  }, []);
  return mode;
}
