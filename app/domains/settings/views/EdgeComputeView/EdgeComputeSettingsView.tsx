import { Settings } from '@/domains/settings/models/types';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/domains/settings/queries';

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
