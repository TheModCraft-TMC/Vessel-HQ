import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { FeatureFlag, useFeatureFlag } from './useFeatureFlag';

export function useRedirectFeatureFlag(flag: FeatureFlag, to = '/') {
  const router = useRouter();
  const pathname = usePathname();

  useFeatureFlag(flag, {
    onSuccess(isEnabled) {
      if (!isEnabled) {
        router.push(buildHref(to, {}, pathname));
      }
    },
  });
}
