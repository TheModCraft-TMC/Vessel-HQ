import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { UpdateNotification } from './UpdateNotifications';
import { BuildInfoModalButton } from './BuildInfoModal';
import '@reach/dialog/styles.css';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <div className={clsx(styles.root, 'text-center')}>
      <UpdateNotification />

      <FooterContent>
        <span>&copy;</span>
        <span>Vessel HQ</span>

        <BuildInfoModalButton />
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
