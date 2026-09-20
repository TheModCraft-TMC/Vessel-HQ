import { Settings } from '@/react/portainer/settings/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';

import { isBE } from '../../feature-flags/feature-flags.service';
import { useSettings, useUpdateSettingsMutation } from '../queries';

import { EdgeComputeSettings } from './EdgeComputeSettings';
import { DeploymentSyncOptions } from './DeploymentSyncOptions/DeploymentSyncOptions';
import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';

interface Props {
  settings: Settings;
  onSubmit(values: Settings): void;
}

export function EdgeComputeSettingsView({ settings, onSubmit }: Props) {
  return (
    <div className="row">
      <EdgeComputeSettings settings={settings} onSubmit={onSubmit} />

      <DeploymentSyncOptions />

      {isBE && <AutomaticEdgeEnvCreation />}
    </div>
  );
}

export function EdgeComputeSettingsRoute() {
  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettingsMutation();

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: 'Settings', link: 'portainer.settings' },
          'Edge Compute',
        ]}
        reload
      />

      {settingsQuery.data && (
        <EdgeComputeSettingsView
          settings={settingsQuery.data}
          onSubmit={(values) =>
            updateMutation.mutate(values, {
              onSuccess: () => notifySuccess('Success', 'Settings updated'),
            })
          }
        />
      )}
    </>
  );
}
