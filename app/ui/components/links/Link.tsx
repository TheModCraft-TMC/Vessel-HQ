import { AnchorHTMLAttributes, MouseEvent, PropsWithChildren } from 'react';
import { UISrefProps, useSref } from '@uirouter/react';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  'data-cy': string;
}

export function Link({
  children,
  'data-cy': dataCy,
  to,
  params,
  options,
  title,
  onClick: onClickProp,
  ...props
}: PropsWithChildren<Props> & UISrefProps) {
  const { onClick: onSrefClick, href } = useSref(to, params, options);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClickProp?.(event);

    if (!event.defaultPrevented) {
      onSrefClick(event);
    }
  }

  return (
    <a
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      onClick={handleClick}
      href={href}
      data-cy={dataCy}
      title={title}
    >
      {children}
    </a>
  );
}
