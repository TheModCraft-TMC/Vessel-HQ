import clsx from 'clsx';
import { ReactNode } from 'react';
import { useId } from 'react';

import styles from './SegmentedControl.module.css';

export interface SegmentItem {
  id: string;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

export type SegmentedControlVariant = 'contained' | 'pill';
export type SegmentedControlSize = 'sm' | 'md';

interface Props {
  items: SegmentItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  size?: SegmentedControlSize;
  variant?: SegmentedControlVariant;
  className?: string;
  label: string;
}

export function SegmentedControl({
  items,
  activeId,
  onChange,
  size = 'md',
  variant = 'contained',
  className,
  label,
}: Props) {
  const groupName = useId();

  return (
    <fieldset className={clsx(styles.root, className)}>
      <legend className="sr-only">{label}</legend>
      <div
        className={styles.options}
        role="radiogroup"
        aria-label={label}
        data-variant={variant}
        data-size={size}
      >
        {items.map((item) => (
          <SegmentedControlItem
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            groupName={groupName}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}

interface ItemProps {
  item: SegmentItem;
  isActive: boolean;
  groupName: string;
  onChange?: (id: string) => void;
}

function SegmentedControlItem({
  item,
  isActive,
  groupName,
  onChange,
}: ItemProps) {
  return (
    <label
      title={item.title}
      className={styles.option}
      data-active={isActive || undefined}
      data-disabled={item.disabled || undefined}
    >
      <input
        type="radio"
        name={groupName}
        value={item.id}
        checked={isActive}
        disabled={item.disabled}
        onChange={() => onChange?.(item.id)}
        className="sr-only"
        aria-label={item.title}
      />
      {item.label}
    </label>
  );
}
