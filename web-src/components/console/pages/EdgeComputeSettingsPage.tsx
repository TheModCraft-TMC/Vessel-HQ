'use client';

import { AutomaticEdgeEnvCreation } from '@/domains/settings/views/EdgeComputeView/AutomaticEdgeEnvCreation';
import { DeploymentSyncOptions } from '@/domains/settings/views/EdgeComputeView/DeploymentSyncOptions/DeploymentSyncOptions';
import { EdgeComputeSettings } from '@/domains/settings/views/EdgeComputeView/EdgeComputeSettings';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/domains/settings/queries';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { notifySuccess } from '@/ui/components/toast/notifications';

export function EdgeComputeSettingsContent() {
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettingsMutation();

  return (
    <div className="row">
        {settingsQuery.data && (
          <EdgeComputeSettings
            settings={settingsQuery.data}
            onSubmit={(settings) =>
              updateSettings.mutate(settings, {
                onSuccess: () => notifySuccess('Success', 'Settings updated'),
              })
            }
          />
        )}
        <DeploymentSyncOptions />
        {isBE && <AutomaticEdgeEnvCreation />}
      </div>
  );
}
