export type ContainerTransitionType = 'container-forward' | 'container-back';

/**
 * Container navigation has three visual levels: list, details, and tools such
 * as logs or console. Moving deeper slides the next page in from the right;
 * moving back toward the list reverses the direction.
 */
export function getContainerTransitionType(
  currentHref: string,
  nextHref: string
): ContainerTransitionType | undefined {
  const currentLevel = getContainerRouteLevel(currentHref);
  const nextLevel = getContainerRouteLevel(nextHref);

  if (currentLevel === undefined || nextLevel === undefined) return undefined;
  if (nextLevel > currentLevel) return 'container-forward';
  if (nextLevel < currentLevel) return 'container-back';

  return undefined;
}

function getContainerRouteLevel(href: string) {
  const pathname = href.split(/[?#]/, 1)[0];
  const match = pathname.match(
    /^\/[^/]+\/docker\/containers(?:\/([^/]+))?(?:\/([^/]+))?\/?$/
  );

  if (!match) return undefined;
  if (!match[1]) return 0;
  if (!match[2]) return 1;
  return 2;
}
