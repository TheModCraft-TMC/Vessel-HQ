import { useEffect } from 'react';

/**
 * Prevents same-origin link navigation when the callback rejects leaving the
 * current screen. External links and modified clicks retain browser behavior.
 */
export function useCanExit(
  canExitCallback: (
    destination?: URL
  ) => boolean | undefined | Promise<boolean | undefined>
) {
  useEffect(() => {
    async function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.href === window.location.href
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if ((await canExitCallback(destination)) !== false) {
        window.location.assign(destination.href);
      }
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [canExitCallback]);
}
