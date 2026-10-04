import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { ComponentType } from 'react';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function useLimitToBE(defaultPath = '/') {
  const router = useRouter();
  const pathname = usePathname();
  if (!isBE) {
    router.push(buildHref(defaultPath, {}, pathname));
    return true;
  }

  return false;
}

export function withLimitToBE<T extends object>(
  WrappedComponent: ComponentType<T>,
  defaultPath = '/'
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T) {
    const isLimitedToBE = useLimitToBE(defaultPath);

    if (isLimitedToBE) {
      return null;
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <WrappedComponent {...props} />;
  }

  WrapperComponent.displayName = `withLimitToBE(${displayName})`;

  return WrapperComponent;
}
