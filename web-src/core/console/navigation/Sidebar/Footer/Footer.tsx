import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

import { BuildInfoButton } from './BuildInfoButton';
import styles from './Footer.module.css';
import { UpdateNotification } from './UpdateNotification';

export function Footer() {
  return (
    <div className={clsx(styles.root, 'text-center')}>
      <UpdateNotification />
      <FooterContent>
        <span>&copy;</span>
        <span>Vessel HQ</span>
        <BuildInfoButton />
      </FooterContent>
    </div>
  );
}

function FooterContent({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="mx-auto flex items-baseline justify-center space-x-1 text-[10px] text-gray-5 be:text-gray-6">
      {children}
    </div>
  );
}
