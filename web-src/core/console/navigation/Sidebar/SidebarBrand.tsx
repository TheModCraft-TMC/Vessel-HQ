import clsx from 'clsx';
import { X } from 'lucide-react';
import { Link } from '@console/navigation/Link';
import { useLayoutStaticValues } from '@console/layout/LayoutContext';

import { useSidebarState } from '../../layout/SidebarState';

import styles from './SidebarBrand.module.css';

interface Props {
  logo?: string;
}

export function SidebarBrand({ logo: customLogo }: Props) {
  const { isOpen, toggle } = useSidebarState();
  const { logos } = useLayoutStaticValues();
  const logo = customLogo || (isOpen ? logos.full : logos.collapsed);

  return (
    <div
      className={clsx('flex w-full flex-wrap', {
        'justify-center pr-5': !isOpen,
        'items-center justify-between': isOpen,
      })}
    >
      <Link
        to="/"
        data-cy="portainerSidebar-homeImage"
        className="text-2xl text-white no-underline hover:text-white hover:no-underline focus:text-white focus:no-underline focus:outline-hidden"
      >
        <img
          src={logo}
          className={clsx('img-responsive', styles.logo, {
            'max-h-[27px]!': !isOpen,
          })}
          alt="Logo"
        />
      </Link>
      {isOpen && (
        <button
          type="button"
          className="border-0 bg-transparent p-1 text-white min-[721px]:hidden"
          aria-label="Close sidebar"
          onClick={toggle}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
