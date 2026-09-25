import clsx from 'clsx';

import { Icon, IconProps } from '@/ui/components/icons/Icon';

type Props = IconProps;

export function LogoIcon({ icon, iconClass }: Props) {
  return (
    <div className="inline-flex h-14 w-14 items-center justify-center text-7xl">
      <Icon icon={icon} className={clsx('!flex', iconClass)} />
    </div>
  );
}
