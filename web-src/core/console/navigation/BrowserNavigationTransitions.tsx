'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const HISTORY_INDEX = '__vesselNavigationIndex';
const TRANSITION_CLEANUP_DELAY = 400;

type VesselHistoryState = Record<string, unknown> & {
  [HISTORY_INDEX]?: number;
};

/**
 * Keeps browser back/forward motion aligned with link navigation. Next handles
 * history traversal itself, so this only records direction for the shared CSS
 * view-transition boundary and never takes ownership of navigation.
 */
export function BrowserNavigationTransitions() {
  const pathname = usePathname();
  const currentIndex = useRef(0);
  const navigating = useRef(false);

  useEffect(() => {
    const initialState = getHistoryState(window.history.state);
    currentIndex.current = initialState[HISTORY_INDEX] ?? 0;

    if (initialState[HISTORY_INDEX] === undefined) {
      window.history.replaceState(
        { ...initialState, [HISTORY_INDEX]: currentIndex.current },
        ''
      );
    }

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history
    );

    window.history.pushState = (state, unused, url) => {
      currentIndex.current += 1;
      originalPushState(
        { ...getHistoryState(state), [HISTORY_INDEX]: currentIndex.current },
        unused,
        url
      );
    };

    window.history.replaceState = (state, unused, url) => {
      originalReplaceState(
        { ...getHistoryState(state), [HISTORY_INDEX]: currentIndex.current },
        unused,
        url
      );
    };

    function handlePopState(event: PopStateEvent) {
      const nextIndex = getHistoryState(event.state)[HISTORY_INDEX];
      const direction =
        nextIndex === undefined || nextIndex < currentIndex.current
          ? 'back'
          : 'forward';

      if (nextIndex !== undefined) currentIndex.current = nextIndex;
      navigating.current = true;
      document.documentElement.dataset.browserNavigation = direction;
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
      delete document.documentElement.dataset.browserNavigation;
    };
  }, []);

  useEffect(() => {
    if (!navigating.current) return undefined;

    navigating.current = false;
    const timeout = window.setTimeout(() => {
      delete document.documentElement.dataset.browserNavigation;
    }, TRANSITION_CLEANUP_DELAY);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return null;
}

function getHistoryState(state: unknown): VesselHistoryState {
  return state && typeof state === 'object'
    ? (state as VesselHistoryState)
    : {};
}
