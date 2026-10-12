'use client';

import clsx from 'clsx';
import { Slash, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  type LayoutEnvironment,
  useLayoutActions,
  useLayoutEnvironment,
} from '@console/layout/LayoutContext';

import { Icon } from '@/ui/components/icons/Icon';

import { useSidebarState } from '../../layout/SidebarState';

import styles from './EnvironmentSidebar.module.css';
import {
  SidebarSection,
  SidebarSectionTitle,
} from './SidebarSection';

const AzureSidebar = dynamic(() =>
  import('@/ui/layouts/navigation/AzureSidebar').then(
    (module) => module.AzureSidebar
  )
);
const DockerSidebar = dynamic(() =>
  import('@/ui/layouts/navigation/DockerSidebar').then(
    (module) => module.DockerSidebar
  )
);
const KubernetesSidebar = dynamic(() =>
  import('@/ui/layouts/navigation/KubernetesSidebar').then(
    (module) => module.KubernetesSidebar
  )
);

export function EnvironmentSidebar() {
  const { environment, environmentLoading } = useLayoutEnvironment();
  const { clearEnvironment } = useLayoutActions();
  const { isOpen } = useSidebarState();

  if ((!isOpen && !environment) || (environmentLoading && !environment)) {
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

function Content({
  environment,
  onClear,
}: {
  environment: LayoutEnvironment;
  onClear(): void;
}) {
  return (
    <SidebarSection
      title={<Title environment={environment} onClear={onClear} />}
      hoverText={environment.Name}
      aria-label={environment.Name}
      showTitleWhenOpen
    >
      <div className="mt-2">
        <PlatformSidebar environment={environment} />
      </div>
    </SidebarSection>
  );
}

function PlatformSidebar({ environment }: { environment: LayoutEnvironment }) {
  if (environment.platform === 'azure') {
    return <AzureSidebar environmentId={environment.Id} />;
  }

  if (environment.platform === 'kubernetes') {
    return <KubernetesSidebar environmentId={environment.Id} />;
  }

  if (
    environment.platform === 'docker' ||
    environment.platform === 'podman'
  ) {
    return (
      <DockerSidebar
        environmentId={environment.Id}
        environment={environment}
      />
    );
  }

  return null;
}

function Title({
  environment,
  onClear,
}: {
  environment: LayoutEnvironment;
  onClear(): void;
}) {
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
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
