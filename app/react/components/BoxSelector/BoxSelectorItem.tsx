import clsx from 'clsx';
import { type LucideIcon, Check } from 'lucide-react';
import { Fragment } from 'react';

import { Icon } from '@/react/components/Icon';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { BadgeIcon } from '@@/BadgeIcon';

import styles from './BoxSelectorItem.module.css';
import { BoxSelectorOption, Value } from './types';
import { BoxOption } from './BoxOption';
import { LogoIcon } from './LogoIcon';

type Props<T extends Value> = {
  option: BoxSelectorOption<T>;
  radioName: string;
  disabled?: boolean;
  tooltip?: string;
  onSelect(value: T, limitedToBE: boolean): void;
  isSelected(value: T): boolean;
  type?: 'radio' | 'checkbox';
  slim?: boolean;
  checkIcon?: LucideIcon;
};

export function BoxSelectorItem<T extends Value>({
  radioName,
  option,
  onSelect,
  disabled,
  tooltip,
  type = 'radio',
  isSelected,
  slim = false,
  checkIcon = Check,
}: Props<T>) {
  const limitedToBE = isLimitedToBE(option.feature);

  const ContentBox = slim ? 'div' : Fragment;

  if (limitedToBE) {
    return null;
  }

  return (
    <BoxOption
      className={styles.boxSelectorItem}
      radioName={radioName}
      option={option}
      isSelected={isSelected}
      disabled={isDisabled()}
      onSelect={(value) => onSelect(value, false)}
      tooltip={tooltip}
      type={type}
      checkIcon={checkIcon}
    >
      <div
        className={clsx('flex min-w-[140px] gap-2', {
          'h-full flex-col justify-start': !slim,
          'slim items-center': slim,
        })}
      >
        <div className={clsx(styles.imageContainer, 'flex items-start')}>
          {renderIcon()}
        </div>
        <ContentBox>
          <div className={styles.header}>{option.label}</div>
          <div className="mb-0">{option.description}</div>
        </ContentBox>
      </div>
    </BoxOption>
  );

  function isDisabled() {
    return disabled;
  }

  function renderIcon() {
    if (!option.icon) {
      return null;
    }

    if (option.iconType === 'badge') {
      return <BadgeIcon icon={option.icon} iconClass={option.iconClass} />;
    }

    if (option.iconType === 'raw') {
      return (
        <Icon
          icon={option.icon}
          className={clsx(styles.icon, option.iconClass, '!flex items-center')}
        />
      );
    }

    return <LogoIcon icon={option.icon} iconClass={option.iconClass} />;
  }
}
