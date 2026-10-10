import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { WidgetBody } from '@@/Widget';
import { Widget } from '@@/Widget/Widget';

import styles from './SortableListCard.module.css';

interface Props {
  className?: string;
}

export function SortableListCard({
  children,
  className,
}: PropsWithChildren<Props>) {
  return (
    <Widget className={clsx(styles.root, className, 'th-dark:!border-gray-8')}>
      <WidgetBody className="overflow-hidden !p-0">{children}</WidgetBody>
    </Widget>
  );
}
