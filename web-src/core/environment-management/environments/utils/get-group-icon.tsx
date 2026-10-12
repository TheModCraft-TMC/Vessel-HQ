import { Layers } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  IconSize,
  IconSizeClass,
} from '@/domains/environments';
import { Icon } from '@/ui/components/icons/Icon';

export function getGroupIcon(size: IconSize): ReactElement {
  const sizeClass = IconSizeClass[size];
  return <Icon className={sizeClass} icon={Layers} />;
}
