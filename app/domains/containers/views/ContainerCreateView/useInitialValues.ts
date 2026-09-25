import { useCurrentStateAndParams } from '@uirouter/react';

import { usePodmanCapabilities } from '@/providers/infrastructure/podman';
import {
  BaseFormValues,
  baseFormUtils,
} from '@/domains/containers/views/ContainerCreateView/BaseForm';
import {
  CapabilitiesTabValues,
  capabilitiesTabUtils,
} from '@/domains/containers/views/ContainerCreateView/CapabilitiesTab';
import {
  CommandsTabValues,
  commandsTabUtils,
} from '@/domains/containers/views/ContainerCreateView/CommandsTab';
import {
  LabelsTabValues,
  labelsTabUtils,
} from '@/domains/containers/views/ContainerCreateView/LabelsTab';
import {
  NetworkTabValues,
  networkTabUtils,
} from '@/domains/containers/views/ContainerCreateView/NetworkTab';
import {
  ResourcesTabValues,
  resourcesTabUtils,
} from '@/domains/containers/views/ContainerCreateView/ResourcesTab';
import {
  RestartPolicy,
  restartPolicyTabUtils,
} from '@/domains/containers/views/ContainerCreateView/RestartPolicyTab';
import {
  VolumesTabValues,
  volumesTabUtils,
} from '@/domains/containers/views/ContainerCreateView/VolumesTab';
import { envVarsTabUtils } from '@/domains/containers/views/ContainerCreateView/EnvVarsTab';
import { UserId } from '@/domains/users';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useWebhooks } from '@/react/portainer/webhooks/useWebhooks';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { EnvVarValues } from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { useNetworksForSelector } from '@/domains/containers';

import { getImageConfig } from '@@/ImageConfigFieldset/getImageConfig';

import { useContainers } from '../../queries/useContainers';
import { useContainer } from '../../queries/useContainer';

import { getDefaultNetworkMode } from './NetworkTab/toViewModel';

export interface Values extends BaseFormValues {
  commands: CommandsTabValues;
  volumes: VolumesTabValues;
  network: NetworkTabValues;
  labels: LabelsTabValues;
  restartPolicy: RestartPolicy;
  resources: ResourcesTabValues;
  capabilities: CapabilitiesTabValues;
  env: EnvVarValues;
}

export function useInitialValues(submitting: boolean, isWindows: boolean) {
  const {
    params: { nodeName, from },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();
  const { user, isPureAdmin } = useCurrentUser();

  const networksQuery = useNetworksForSelector();

  const fromContainerQuery = useContainer(
    { environmentId, containerId: from, nodeName },
    {
      enabled: !submitting,
      select: (c) => c,
    }
  );

  const runningContainersQuery = useContainers(environmentId, {
    enabled: !!from,
  });
  const webhookQuery = useWebhooks(
    { endpointId: environmentId, resourceId: from },
    { enabled: !!from }
  );
  const registriesQuery = useEnvironmentRegistries(environmentId, {
    enabled: !!from,
  });
  const podmanCapabilities = usePodmanCapabilities(environmentId);

  if (!networksQuery.data) {
    return null;
  }

  if (!from) {
    return {
      initialValues: defaultValues(
        isPureAdmin,
        user.Id,
        nodeName,
        isWindows,
        podmanCapabilities.defaultNetworkName
      ),
    };
  }

  const fromContainer = fromContainerQuery.data;
  if (
    !fromContainer ||
    !registriesQuery.data ||
    !runningContainersQuery.data ||
    !webhookQuery.data
  ) {
    return null;
  }

  const network = networkTabUtils.toViewModel(
    fromContainer,
    networksQuery.data,
    runningContainersQuery.data
  );

  const extraNetworks = Object.entries(
    fromContainer.NetworkSettings?.Networks || {}
  )
    .filter(
      ([n]) =>
        n !== network.networkMode &&
        n !==
          getDefaultNetworkMode(
            isWindows,
            podmanCapabilities.defaultNetworkName
          )
    )
    .map(([networkName, network]) => ({
      networkName,
      aliases: (network.Aliases || []).filter(
        (o) => !fromContainer.Id?.startsWith(o)
      ),
    }));

  const imageConfig = getImageConfig(
    fromContainer?.Config?.Image || '',
    registriesQuery.data
  );

  const initialValues: Values = {
    commands: commandsTabUtils.toViewModel(fromContainer),
    volumes: volumesTabUtils.toViewModel(fromContainer),
    network: networkTabUtils.toViewModel(
      fromContainer,
      networksQuery.data,
      runningContainersQuery.data,
      podmanCapabilities.defaultNetworkName
    ),
    labels: labelsTabUtils.toViewModel(fromContainer),
    restartPolicy: restartPolicyTabUtils.toViewModel(fromContainer),
    resources: resourcesTabUtils.toViewModel(fromContainer),
    capabilities: capabilitiesTabUtils.toViewModel(fromContainer),
    env: envVarsTabUtils.toViewModel(fromContainer),
    ...baseFormUtils.toViewModel(
      fromContainer,
      isPureAdmin,
      user.Id,
      nodeName,
      imageConfig,
      (webhookQuery.data?.length || 0) > 0
    ),
  };

  return { initialValues, isDuplicating: true, extraNetworks };
}

function defaultValues(
  isPureAdmin: boolean,
  currentUserId: UserId,
  nodeName: string,
  isWindows: boolean,
  defaultNetworkName = 'bridge'
): Values {
  return {
    commands: commandsTabUtils.getDefaultViewModel(),
    volumes: volumesTabUtils.getDefaultViewModel(),
    network: networkTabUtils.getDefaultViewModel(isWindows, defaultNetworkName), // windows containers should default to the nat network, not the bridge
    labels: labelsTabUtils.getDefaultViewModel(),
    restartPolicy: restartPolicyTabUtils.getDefaultViewModel(),
    resources: resourcesTabUtils.getDefaultViewModel(),
    capabilities: capabilitiesTabUtils.getDefaultViewModel(),
    env: envVarsTabUtils.getDefaultViewModel(),
    ...baseFormUtils.getDefaultViewModel(isPureAdmin, currentUserId, nodeName),
  };
}
