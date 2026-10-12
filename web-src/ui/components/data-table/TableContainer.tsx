import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Widget, WidgetBody } from '@/ui/components/layout/Widget';

interface Props {
  // workaround to remove the widget, ideally we should have a different component to wrap the table with a widget
  noWidget?: boolean;
  flush?: boolean;
  'aria-label'?: string;
  id?: string;
}

export function TableContainer({
  children,
  noWidget = false,
  flush = false,
  'aria-label': ariaLabel,
  id,
}: PropsWithChildren<Props>) {
  if (noWidget) {
    return (
      <section className="datatable" aria-label={ariaLabel}>
        {children}
      </section>
    );
  }

  return (
    <div className={clsx('datatable', { 'mx-4': !flush })}>
      <Widget aria-label={ariaLabel} id={id}>
        <WidgetBody className="no-padding">{children}</WidgetBody>
      </Widget>
    </div>
  );
}
