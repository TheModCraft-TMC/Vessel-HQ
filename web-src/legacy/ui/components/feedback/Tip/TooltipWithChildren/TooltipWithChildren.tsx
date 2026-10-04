import React, { MouseEvent } from 'react';
import Tippy, { type TippyProps } from '@tippyjs/react';
import clsx from 'clsx';
import _ from 'lodash';

import 'tippy.js/dist/tippy.css';

import styles from './TooltipWithChildren.module.css';

export type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: React.ReactNode;
  className?: string;
  children: React.ReactElement;
  heading?: string;
  appendTo?: TippyProps['appendTo'];
}

export function TooltipWithChildren({
  message,
  position = 'bottom',
  className,
  children,
  heading,
  appendTo,
}: Props) {
  const id = _.uniqueId('tooltip-');

  const messageHTML = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={styles.tooltipContainer}
      onClick={onClickHandler}
      onMouseDown={onMouseDownHandler}
    >
      {heading && (
        <div className="mb-3 inline-flex w-full justify-between">
          <span>{heading}</span>
        </div>
      )}
      <div className={styles.tooltipMessage}>{message}</div>
    </div>
  );

  return (
    <Tippy
      className={clsx(id, styles.tooltip, className)}
      content={messageHTML}
      delay={[50, 500]} // 50ms to open, 500ms to hide
      zIndex={1000}
      placement={position}
      maxWidth={400}
      appendTo={appendTo}
      arrow
      allowHTML
      interactive
      disabled={!message}
    >
      <span>{children}</span>
    </Tippy>
  );
}

// Preventing click bubbling to the parent as it is affecting
// mainly toggles when full row is clickable.
function onClickHandler(e: MouseEvent) {
  e.stopPropagation();
}

function onMouseDownHandler(e: MouseEvent) {
  e.stopPropagation();
}
