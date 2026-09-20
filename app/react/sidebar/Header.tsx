import clsx from 'clsx';
import { X } from 'lucide-react';

import fullLogo from '@/assets/images/vessel-hq-logo.svg';
import vesselIcon from '@/assets/ico/vessel-hq-mark.svg';

import { Link } from '@@/Link';

import { useSidebarState } from './useSidebarState';
import styles from './Header.module.css';

interface Props {
  logo?: string;
}

export function Header({ logo: customLogo }: Props) {
  const { isOpen, toggle } = useSidebarState();

  return (
    <div
      className={clsx('flex w-full flex-wrap', {
        'justify-center pr-5': !isOpen,
        'items-center justify-between': isOpen,
      })}
    >
      <Link
        to="portainer.home"
        data-cy="portainerSidebar-homeImage"
        className="text-2xl text-white no-underline hover:text-white hover:no-underline focus:text-white focus:no-underline focus:outline-none"
      >
        <Logo customLogo={customLogo} isOpen={isOpen} />
      </Link>
      {isOpen && (
        <button
          type="button"
          className="border-0 bg-transparent p-1 text-white min-[561px]:hidden"
          aria-label="Close sidebar"
          onClick={toggle}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function getLogo(isOpen: boolean, customLogo?: string) {
  if (customLogo) {
    return customLogo;
  }

  if (!isOpen) {
    return vesselIcon;
  }

  return fullLogo;
}

function Logo({
  customLogo,
  isOpen,
}: {
  customLogo?: string;
  isOpen: boolean;
}) {
  const logo = getLogo(isOpen, customLogo);

  return (
    <img
      src={logo}
      className={clsx('img-responsive', styles.logo, {
        '!max-h-[27px]': !isOpen,
      })}
      alt="Logo"
    />
  );
}
