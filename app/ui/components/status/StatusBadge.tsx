import { PropsWithChildren } from 'react';

import { IconProps } from '@/ui/components/icons/Icon';
import { Badge, BadgeType } from '@/ui/components/status/Badge';

export type StatusBadgeType =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'successLite'
  | 'dangerLite'
  | 'warningLite'
  | 'mutedLite'
  | 'infoLite'
  | 'default';

const typeToBadgeType: Record<StatusBadgeType, BadgeType | 'custom'> = {
  success: 'success',
  warning: 'warn',
  danger: 'danger',
  info: 'info',
  successLite: 'successSecondary',
  warningLite: 'warnSecondary',
  dangerLite: 'dangerSecondary',
  mutedLite: 'muted',
  infoLite: 'infoSecondary',
  default: 'custom',
};

/** @deprecated Use Badge directly */
export function StatusBadge({
  className,
  children,
  color = 'default',
  icon,
}: PropsWithChildren<{
  className?: string;
  color?: StatusBadgeType;
  icon?: IconProps['icon'];
}>) {
  return (
    <Badge
      type={typeToBadgeType[color]}
      shape="rect"
      icon={icon}
      className={className ?? ''}
    >
      {children}
    </Badge>
  );
}
