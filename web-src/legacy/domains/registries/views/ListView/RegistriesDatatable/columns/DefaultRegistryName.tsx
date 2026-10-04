import clsx from 'clsx';

import { usePublicSettings } from '@/domains/settings';

export function DefaultRegistryName() {
  const settingsQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });

  return (
    <span
      className={clsx({
        'cm-strikethrough': settingsQuery.isSuccess && settingsQuery.data,
      })}
    >
      Docker Hub (anonymous)
    </span>
  );
}
