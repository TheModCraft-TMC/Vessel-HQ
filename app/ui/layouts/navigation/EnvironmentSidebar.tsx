import { X, Slash } from 'lucide-react';
import clsx from 'clsx';

import { Icon } from '@/ui/components/icons/Icon';
import {
  useLayoutBindings,
  type LayoutEnvironment,
} from '@/ui/layouts/layout-context';

import styles from './EnvironmentSidebar.module.css';
import { AzureSidebar } from './AzureSidebar';
import { DockerSidebar } from './DockerSidebar';
import { KubernetesSidebar } from './KubernetesSidebar';
import { SidebarSection, SidebarSectionTitle } from './SidebarSection';
import { useSidebarState } from './useSidebarState';

const sidebars: Record<
  LayoutEnvironment['platform'],
  React.ComponentType<{ environmentId: number; environment: LayoutEnvironment }>
> = {
  azure: AzureSidebar,
  docker: DockerSidebar,
  podman: DockerSidebar,
  kubernetes: KubernetesSidebar,
};

export function EnvironmentSidebar() {
  const { environment, environmentLoading, clearEnvironment } =
    useLayoutBindings();

  const { isOpen } = useSidebarState();

  if ((!isOpen && !environment) || environmentLoading) {
    return null;
  }

  return (
    <div className={clsx(styles.root, 'rounded py-2')}>
      {environment ? (
        <Content environment={environment} onClear={clearEnvironment} />
      ) : (
        <SidebarSectionTitle>
          <div className="flex items-center gap-1">
            <span>Environment:</span>
            <Icon icon={Slash} className="text-xl !text-gray-6" />
            <span className="text-sm text-gray-6">None selected</span>
          </div>
        </SidebarSectionTitle>
      )}
    </div>
  );
}

interface ContentProps {
  environment: NonNullable<ReturnType<typeof useLayoutBindings>['environment']>;
  onClear: () => void;
}

function Content({ environment, onClear }: ContentProps) {
  const Sidebar = sidebars[environment.platform];

  return (
    <SidebarSection
      title={<Title environment={environment} onClear={onClear} />}
      hoverText={environment.Name}
      aria-label={environment.Name}
      showTitleWhenOpen
    >
      <div className="mt-2">
        {Sidebar && (
          <Sidebar environmentId={environment.Id} environment={environment} />
        )}
      </div>
    </SidebarSection>
  );
}

interface TitleProps {
  environment: ContentProps['environment'];
  onClear(): void;
}

function Title({ environment, onClear }: TitleProps) {
  const { isOpen } = useSidebarState();

  const EnvironmentIcon = environment.PlatformIcon;

  if (!isOpen) {
    return (
      <div className="-ml-3 flex w-8 justify-center" title={environment.Name}>
        <EnvironmentIcon className="text-2xl" />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <EnvironmentIcon className="mr-3 text-2xl" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-white">
        {environment.Name}
      </span>

      <button
        title="Clear environment"
        type="button"
        onClick={onClear}
        className={clsx(
          styles.closeBtn,
          'ml-auto mr-2 flex h-5 w-5 items-center justify-center rounded border-0 p-1 text-sm text-white transition-colors duration-200'
        )}
      >
        <X />
      </button>
    </div>
  );
}
