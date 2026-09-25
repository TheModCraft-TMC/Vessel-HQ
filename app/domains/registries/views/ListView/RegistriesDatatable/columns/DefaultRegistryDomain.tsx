import clsx from 'clsx';

import { usePublicSettings } from '@/domains/settings';

export function DefaultRegistryDomain() {
  const settingsQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });

  return (
    <span
      className={clsx({
        'cm-strikethrough': settingsQuery.isSuccess && settingsQuery.data,
      })}
    >
      docker.io
    </span>
  );
}
