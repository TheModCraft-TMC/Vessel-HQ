import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useStore } from 'zustand';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { useEffect, useState } from 'react';

import { environmentStore } from '@/react/hooks/current-environment-store';
import { Environment } from '@/domains/environments';
import { isEdgeEnvironment } from '@/domains/environments/utils';
import { confirm } from '@/ui/components/dialog/confirm';
import { PageHeader } from '@/ui/layouts/view-layout';
import { ModalType } from '@/ui/components/dialog';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

import { EnvironmentHomeView } from '../EnvironmentHomeView';

import { EdgeLoadingSpinner } from './EdgeLoadingSpinner';
import { LicenseNodePanel } from './LicenseNodePanel';
import { BackupFailedPanel } from './BackupFailedPanel';

export function HomeView() {
  const { clear: clearStore } = useStore(environmentStore);

  const params = useRouteParams();
  const [connectingToEdgeEndpoint, setConnectingToEdgeEndpoint] = useState(
    !!params.redirect
  );

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function redirect() {
      const options = {
        title: `Failed connecting to ${params.environmentName}`,
        message: `There was an issue connecting to edge agent via tunnel. Click 'Retry' below to retry now, or wait 10 seconds to automatically retry.`,
        confirmButton: buildConfirmButton('Retry', 'primary', 10),
        modalType: ModalType.Destructive,
      };

      if (await confirm(options)) {
        setConnectingToEdgeEndpoint(true);
        router.push(
          buildHref(
            params.route,
            {
              endpointId: params.environmentId,
            },
            pathname
          )
        );
      } else {
        clearStore();
        router.push(buildHref('/', {}, pathname));
      }
    }

    if (params.redirect) {
      redirect();
    }
  }, [params, setConnectingToEdgeEndpoint, router, clearStore]);

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        reload
        title="Home"
        breadcrumbs={[{ label: 'Environments' }]}
      />

      {process.env.PORTAINER_EDITION !== 'CE' && <LicenseNodePanel />}

      {process.env.PORTAINER_EDITION !== 'CE' && <BackupFailedPanel />}

      {connectingToEdgeEndpoint ? (
        <div className="mb-5 flex flex-1 flex-col items-center justify-center">
          <EdgeLoadingSpinner />
        </div>
      ) : (
        <EnvironmentHomeView onClickBrowse={handleBrowseClick} />
      )}
    </div>
  );

  function handleBrowseClick(environment: Environment) {
    if (isEdgeEnvironment(environment.Type)) {
      setConnectingToEdgeEndpoint(true);
    }
  }
}
