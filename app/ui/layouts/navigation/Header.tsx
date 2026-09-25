import clsx from 'clsx';
import { X } from 'lucide-react';

import { Link } from '@/ui/components/links/Link';
import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { useSidebarState } from './useSidebarState';
import styles from './Header.module.css';

interface Props {
  logo?: string;
}

export function Header({ logo: customLogo }: Props) {
  const { isOpen, toggle } = useSidebarState();
  const { logos } = useLayoutBindings();

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
        <Logo customLogo={customLogo} isOpen={isOpen} logos={logos} />
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

function getLogo(
  isOpen: boolean,
  customLogo: string | undefined,
  logos: { full: string; collapsed: string }
) {
  if (customLogo) {
    return customLogo;
  }

  if (!isOpen) {
    return logos.collapsed;
  }

  return logos.full;
}

function Logo({
  customLogo,
  isOpen,
  logos,
}: {
  customLogo?: string;
  isOpen: boolean;
  logos: { full: string; collapsed: string };
}) {
  const logo = getLogo(isOpen, customLogo, logos);

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
