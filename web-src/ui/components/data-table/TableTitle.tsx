import { Children, PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import { Icon } from '@/ui/components/icons/Icon';
import type { IconSource } from '@/ui/components/icons/Icon';

import styles from './TableTitle.module.css';

interface Props {
  icon?: IconSource;
  label: React.ReactNode;
  description?: ReactNode;
  className?: string;
  id?: string;
}

export function TableTitle({
  icon,
  label,
  children,
  description,
  className,
  id,
}: PropsWithChildren<Props>) {
  const controls = Children.toArray(children);

  return (
    <>
      <div className={clsx('toolBar flex-col', className)} id={id}>
        <div className="flex w-full items-center gap-1 p-0">
          <h2 className="toolBarTitle m-0 text-base">
            {icon && (
              <div className="widget-icon">
                <Icon icon={icon} className="space-right" />
              </div>
            )}

            {label}
          </h2>
          {controls.length > 0 && (
            <div className={styles.controls}>{controls}</div>
          )}
        </div>
      </div>
      {!!description && <div className="toolBar pt-0!">{description}</div>}
    </>
  );
}
