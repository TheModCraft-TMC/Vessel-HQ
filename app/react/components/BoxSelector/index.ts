import type { FeatureId } from '@/react/portainer/feature-flags/enums';
import type { IconProps } from '@/ui/components/icons/Icon';

import type { BoxSelectorOption } from './types';

export { BoxSelector } from './BoxSelector';
export type { BoxSelectorOption } from './types';

export function buildOption<T extends number | string>(
  id: BoxSelectorOption<T>['id'],
  icon: IconProps['icon'],
  label: BoxSelectorOption<T>['label'],
  description: BoxSelectorOption<T>['description'],
  value: BoxSelectorOption<T>['value'],
  feature?: FeatureId
): BoxSelectorOption<T> {
  return { id, icon, label, description, value, feature };
}
