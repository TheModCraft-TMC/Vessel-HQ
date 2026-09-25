import clsx from 'clsx';

import type { AutomationTestingProps } from '@/ui/types';

import './Switch.css';

import styles from './Switch.module.css';

export interface Props extends AutomationTestingProps {
  checked: boolean;
  id: string;
  name: string;
  onChange(checked: boolean, index?: number): void;

  index?: number;
  className?: string;
  disabled?: boolean;
  featureId?: string;
  isLimitedToBE?: (featureId?: string) => boolean;
}

export function Switch({
  name,
  checked,
  id,
  disabled,
  'data-cy': dataCy,
  onChange,
  index,
  featureId,
  isLimitedToBE = () => false,
  className,
}: Props) {
  const limitedToBE = isLimitedToBE(featureId);

  if (limitedToBE) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- accessible text is provided by the parent SwitchField label
    <label
      className={clsx('switch', className, styles.root)}
      data-cy={dataCy}
      aria-checked={checked}
    >
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={({ target: { checked } }) => onChange(checked, index)}
      />
      <span className="slider round before:content-['']" />
    </label>
  );
}
