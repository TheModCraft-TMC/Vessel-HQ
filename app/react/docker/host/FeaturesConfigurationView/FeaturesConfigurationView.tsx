import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { updateSettings } from '@/react/portainer/environments/environment.service';
import { environmentQueryKeys } from '@/react/portainer/environments/queries/query-keys';
import {
  Environment,
  EnvironmentSecuritySettings,
} from '@/domains/environments';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/core/query';
import { LoadingButton } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { Gpu, GpusList } from '../SetupView/GpusList';

type SettingsPayload = EnvironmentSecuritySettings & {
  enableGPUManagement: boolean;
  gpus: Gpu[];
};

const securityToggles: Array<{
  key: keyof EnvironmentSecuritySettings;
  label: string;
  tooltip?: string;
}> = [
  {
    key: 'allowBindMountsForRegularUsers',
    label: 'Hide bind mounts for non-administrators',
    tooltip:
      'Hide bind mounts from regular users when creating containers, services, or stacks.',
  },
  {
    key: 'allowPrivilegedModeForRegularUsers',
    label: 'Hide privileged mode for non-administrators',
  },
  {
    key: 'allowHostNamespaceForRegularUsers',
    label: 'Hide the use of host PID 1 for non-administrators',
  },
  {
    key: 'allowStackManagementForRegularUsers',
    label: 'Hide the use of Stacks for non-administrators',
  },
  {
    key: 'allowDeviceMappingForRegularUsers',
    label: 'Hide device mappings for non-administrators',
  },
  {
    key: 'allowContainerCapabilitiesForRegularUsers',
    label: 'Hide container capabilities for non-administrators',
  },
  {
    key: 'allowSysctlSettingForRegularUsers',
    label: 'Hide sysctl settings for non-administrators',
  },
  {
    key: 'allowSecurityOptForRegularUsers',
    label: 'Hide security-opt for non-administrators',
  },
];

export function FeaturesConfigurationView() {
  const environmentQuery = useCurrentEnvironment();

  return (
    <>
      <PageHeader
        title="Docker features configuration"
        breadcrumbs={['Docker configuration']}
      />
      {environmentQuery.data && (
        <FeaturesForm environment={environmentQuery.data} />
      )}
    </>
  );
}

function FeaturesForm({ environment }: { environment: Environment }) {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const infoQuery = useInfo(environmentId);
  const isAgent = isAgentEnvironment(environment.Type);
  const isDockerStandalone = !infoQuery.data?.Swarm?.NodeID && !isAgent;
  const [settings, setSettings] = useState<EnvironmentSecuritySettings>(
    environment.SecuritySettings
  );
  const [enableGPUManagement, setEnableGPUManagement] = useState(
    isDockerStandalone &&
      (environment.EnableGPUManagement || Boolean(environment.Gpus?.length))
  );
  const [gpus, setGpus] = useState<Gpu[]>(environment.Gpus || []);
  const mutation = useMutation(
    (payload: SettingsPayload) => updateSettings(environmentId, payload),
    {
      ...withError('Failed saving settings'),
      onSuccess: async () => {
        notifySuccess('Success', 'Saved settings successfully');
        await queryClient.invalidateQueries(
          environmentQueryKeys.item(environmentId)
        );
      },
    }
  );
  const containerEditDisabled =
    !settings.allowBindMountsForRegularUsers ||
    !settings.allowHostNamespaceForRegularUsers ||
    !settings.allowPrivilegedModeForRegularUsers ||
    !settings.allowDeviceMappingForRegularUsers ||
    !settings.allowContainerCapabilitiesForRegularUsers ||
    !settings.allowSysctlSettingForRegularUsers ||
    !settings.allowSecurityOptForRegularUsers;

  return (
    <div className="row">
      <div className="col-xs-12">
        <Widget>
          <WidgetBody>
            <form
              className="form-horizontal"
              onSubmit={(event) => {
                event.preventDefault();
                const validGpus = gpus.filter((gpu) => gpu.name && gpu.value);
                mutation.mutate({
                  ...settings,
                  enableGPUManagement,
                  gpus: enableGPUManagement ? validGpus : [],
                });
              }}
            >
              <FormSection title="Host and filesystem">
                <TextTip>
                  Host management requires the Vessel HQ Agent with the host
                  root mounted at <b>/host</b>.
                </TextTip>
                <SwitchRow
                  label="Enable host management features"
                  tooltip="Enable host system browsing and advanced host details."
                  checked={settings.enableHostManagementFeatures}
                  disabled={!isAgent}
                  onChange={(value) =>
                    updateSetting('enableHostManagementFeatures', value)
                  }
                  dataCy="enable-host-management"
                />
                <SwitchRow
                  label="Enable volume management for non-administrators"
                  tooltip="Allow regular users to browse and manage volume contents."
                  checked={settings.allowVolumeBrowserForRegularUsers}
                  disabled={!isAgent}
                  onChange={(value) =>
                    updateSetting('allowVolumeBrowserForRegularUsers', value)
                  }
                  dataCy="allow-volume-browser"
                />
              </FormSection>

              <FormSection title="Docker security settings">
                {securityToggles.map(({ key, label, tooltip }) => (
                  <SwitchRow
                    key={key}
                    label={label}
                    tooltip={tooltip}
                    checked={!settings[key]}
                    onChange={(hidden) => updateSetting(key, !hidden)}
                    dataCy={key}
                  />
                ))}
                {containerEditDisabled && (
                  <TextTip>
                    The recreate, duplicate, and edit actions are hidden from
                    non-administrators by one or more security settings.
                  </TextTip>
                )}
              </FormSection>

              <FormSection title="Other">
                {!isDockerStandalone && (
                  <TextTip>
                    GPU controls are available only for standalone Docker
                    environments and currently support NVIDIA GPUs.
                  </TextTip>
                )}
                <SwitchRow
                  label="Show GPU in the UI"
                  tooltip="Enable GPU selection for containers and stacks."
                  checked={enableGPUManagement}
                  disabled={!isDockerStandalone}
                  onChange={setEnableGPUManagement}
                  dataCy="enable-gpu-management"
                />
                {enableGPUManagement && (
                  <div className="pl-4">
                    <TextTip>
                      GPU support is currently limited to NVIDIA graphics cards.
                    </TextTip>
                    <GpusList value={gpus} onChange={setGpus} />
                  </div>
                )}
              </FormSection>

              <FormSection title="Actions">
                <div className="form-group">
                  <div className="col-sm-12">
                    <LoadingButton
                      isLoading={mutation.isLoading}
                      loadingText="Saving..."
                      data-cy="save-docker-features"
                    >
                      Save configuration
                    </LoadingButton>
                  </div>
                </div>
              </FormSection>
            </form>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  function updateSetting<Key extends keyof EnvironmentSecuritySettings>(
    key: Key,
    value: EnvironmentSecuritySettings[Key]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }
}

function SwitchRow({
  label,
  tooltip,
  checked,
  disabled,
  onChange,
  dataCy,
}: {
  label: string;
  tooltip?: string;
  checked: boolean;
  disabled?: boolean;
  onChange(value: boolean): void;
  dataCy: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          label={label}
          tooltip={tooltip}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          labelClass="col-sm-7 col-lg-4"
          data-cy={dataCy}
        />
      </div>
    </div>
  );
}
