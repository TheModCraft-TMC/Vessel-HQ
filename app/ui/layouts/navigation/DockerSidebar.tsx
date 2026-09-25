import {
  Box,
  Clock,
  Layers,
  List,
  Lock,
  Shuffle,
  Trello,
  Clipboard,
  Edit,
  Network,
  Database,
} from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { SidebarItem } from './SidebarItem';
import { DashboardLink } from './items/DashboardLink';
import { SidebarParent } from './SidebarItem/SidebarParent';

interface Props {
  environmentId: number;
  environment: {
    SecuritySettings?: {
      allowStackManagementForRegularUsers?: boolean;
    };
  };
}

export function DockerSidebar({ environmentId, environment }: Props) {
  const { docker, Authorized } = useLayoutBindings();
  const { isEnvironmentAdmin, isSwarmManager, apiVersion } = docker;

  const areStacksVisible =
    isEnvironmentAdmin ||
    environment.SecuritySettings?.allowStackManagementForRegularUsers;

  const setupSubMenuProps = isSwarmManager
    ? {
        label: 'Swarm',
        icon: Trello,
        to: 'docker.swarm',
        dataCy: 'portainerSidebar-swarm',
      }
    : {
        label: 'Host',
        icon: Trello,
        to: 'docker.host',
        dataCy: 'portainerSidebar-host',
      };

  const featSubMenuTo = isSwarmManager
    ? 'docker.swarm.featuresConfiguration'
    : 'docker.host.featuresConfiguration';
  const registrySubMenuTo = isSwarmManager
    ? 'docker.swarm.registries'
    : 'docker.host.registries';

  return (
    <>
      <DashboardLink
        environmentId={environmentId}
        platformPath="docker"
        data-cy="dockerSidebar-dashboard"
      />
      <SidebarParent
        icon={Edit}
        label="Templates"
        to="docker.templates"
        params={{ endpointId: environmentId }}
        data-cy="portainerSidebar-templates"
        listId="dockerSidebar-templates"
      >
        <SidebarItem
          label="Application"
          to="docker.templates"
          ignorePaths={['docker.templates.custom']}
          params={{ endpointId: environmentId }}
          isSubMenu
          data-cy="portainerSidebar-appTemplates"
        />
        <SidebarItem
          label="Custom"
          to="docker.templates.custom"
          params={{ endpointId: environmentId }}
          isSubMenu
          data-cy="dockerSidebar-customTemplates"
        />
      </SidebarParent>

      {areStacksVisible && (
        <SidebarItem
          to="docker.stacks"
          params={{ endpointId: environmentId }}
          icon={Layers}
          label="Stacks"
          data-cy="dockerSidebar-stacks"
        />
      )}

      {isSwarmManager && (
        <SidebarItem
          to="docker.services"
          params={{ endpointId: environmentId }}
          icon={Shuffle}
          label="Services"
          data-cy="dockerSidebar-services"
        />
      )}

      <SidebarItem
        to="docker.containers"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Containers"
        data-cy="dockerSidebar-containers"
      />

      <SidebarItem
        to="docker.images"
        params={{ endpointId: environmentId }}
        icon={List}
        label="Images"
        data-cy="dockerSidebar-images"
      />

      <SidebarItem
        to="docker.networks"
        params={{ endpointId: environmentId }}
        icon={Network}
        label="Networks"
        data-cy="dockerSidebar-networks"
      />

      <SidebarItem
        to="docker.volumes"
        params={{ endpointId: environmentId }}
        icon={Database}
        label="Volumes"
        data-cy="dockerSidebar-volumes"
      />

      {apiVersion >= 1.3 && isSwarmManager && (
        <SidebarItem
          to="docker.configs"
          params={{ endpointId: environmentId }}
          icon={Clipboard}
          label="Configs"
          data-cy="dockerSidebar-configs"
        />
      )}

      {apiVersion >= 1.25 && isSwarmManager && (
        <SidebarItem
          to="docker.secrets"
          params={{ endpointId: environmentId }}
          icon={Lock}
          label="Secrets"
          data-cy="dockerSidebar-secrets"
        />
      )}

      {!isSwarmManager && isEnvironmentAdmin && (
        <SidebarItem
          to="docker.events"
          params={{ endpointId: environmentId }}
          icon={Clock}
          label="Events"
          data-cy="dockerSidebar-events"
        />
      )}

      <SidebarParent
        label={setupSubMenuProps.label}
        icon={setupSubMenuProps.icon}
        to={setupSubMenuProps.to}
        params={{ endpointId: environmentId }}
        data-cy="portainerSidebar-host-area"
        listId="portainerSidebar-host-area"
      >
        <SidebarItem
          label="Details"
          isSubMenu
          to={setupSubMenuProps.to}
          params={{ endpointId: environmentId }}
          ignorePaths={[featSubMenuTo, registrySubMenuTo]}
          data-cy={setupSubMenuProps.dataCy}
        />

        <Authorized
          authorizations="PortainerEndpointUpdateSettings"
          adminOnlyCE
          environmentId={environmentId}
        >
          <SidebarItem
            label="Setup"
            isSubMenu
            to={featSubMenuTo}
            params={{ endpointId: environmentId }}
            data-cy="portainerSidebar-docker-setup"
          />
        </Authorized>

        <SidebarItem
          label="Registries"
          isSubMenu
          to={registrySubMenuTo}
          params={{ endpointId: environmentId }}
          data-cy="portainerSidebar-docker-registries"
        />
      </SidebarParent>
    </>
  );
}
