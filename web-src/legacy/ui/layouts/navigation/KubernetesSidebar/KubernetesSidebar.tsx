import {
  Box,
  Database,
  Edit,
  Layers,
  LayoutList,
  Lock,
  Network,
  Server,
} from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';
import { SidebarParent } from '../SidebarItem/SidebarParent';

import { KubectlShellButton } from './KubectlShellButton';

interface Props {
  environmentId: number;
}

export function KubernetesSidebar({ environmentId }: Props) {
  const { Authorized } = useLayoutBindings();
  return (
    <>
      <div className="-mt-2 mb-2 flex w-full justify-center">
        <KubectlShellButton environmentId={environmentId} />
      </div>

      <DashboardLink
        environmentId={environmentId}
        platformPath="kubernetes"
        data-cy="k8sSidebar-dashboard"
      />

      <SidebarItem
        to="/:endpointId/kubernetes/templates/custom"
        params={{ endpointId: environmentId }}
        icon={Edit}
        label="Custom Templates"
        data-cy="k8sSidebar-customTemplates"
      />

      <SidebarItem
        to="/:endpointId/kubernetes/namespaces"
        params={{ endpointId: environmentId }}
        icon={Layers}
        label="Namespaces"
        data-cy="k8sSidebar-namespaces"
      />

      <SidebarItem
        to="/:endpointId/kubernetes/applications"
        params={{ endpointId: environmentId }}
        includePaths={[
          '/:endpointId/kubernetes/helm/:namespace/:name',
          '/:endpointId/kubernetes/helm',
        ]}
        icon={Box}
        label="Applications"
        data-cy="k8sSidebar-applications"
      />

      <SidebarParent
        label="Networking"
        icon={Network}
        to="/:endpointId/kubernetes/services"
        params={{ endpointId: environmentId }}
        pathOptions={{ includePaths: ['/:endpointId/kubernetes/ingresses'] }}
        data-cy="k8sSidebar-networking"
        listId="k8sSidebar-networking"
      >
        <SidebarItem
          to="/:endpointId/kubernetes/services"
          params={{ endpointId: environmentId }}
          label="Services"
          isSubMenu
          data-cy="k8sSidebar-services"
        />

        <SidebarItem
          to="/:endpointId/kubernetes/ingresses"
          params={{ endpointId: environmentId }}
          label="Ingresses"
          isSubMenu
          data-cy="k8sSidebar-ingresses"
        />
      </SidebarParent>

      <SidebarItem
        to="/:endpointId/kubernetes/configurations"
        params={{ endpointId: environmentId }}
        icon={Lock}
        label="ConfigMaps & Secrets"
        data-cy="k8sSidebar-configurations"
      />

      <SidebarItem
        to="/:endpointId/kubernetes/volumes"
        params={{ endpointId: environmentId }}
        icon={Database}
        label="Volumes"
        data-cy="k8sSidebar-volumes"
      />

      <SidebarParent
        label="More Resources"
        to="/:endpointId/kubernetes/moreResources/jobs"
        pathOptions={{
          includePaths: [
            '/:endpointId/kubernetes/moreResources/jobs',
            '/:endpointId/kubernetes/moreResources/serviceAccounts',
            '/:endpointId/kubernetes/moreResources/clusterRoles',
            '/:endpointId/kubernetes/moreResources/roles',
          ],
        }}
        icon={LayoutList}
        params={{ endpointId: environmentId }}
        data-cy="k8sSidebar-moreResources"
        listId="k8sSidebar-moreResources"
      >
        <SidebarItem
          to="/:endpointId/kubernetes/moreResources/jobs"
          params={{ endpointId: environmentId }}
          label="Cron Jobs & Jobs"
          data-cy="k8sSidebar-jobs"
          isSubMenu
        />
        <Authorized
          authorizations="K8sMoreResourcesRW"
          adminOnlyCE
          environmentId={environmentId}
        >
          <SidebarItem
            to="/:endpointId/kubernetes/moreResources/serviceAccounts"
            params={{ endpointId: environmentId }}
            label="Service Accounts"
            data-cy="k8sSidebar-serviceAccounts"
            isSubMenu
          />
          <SidebarItem
            to="/:endpointId/kubernetes/moreResources/clusterRoles"
            params={{ endpointId: environmentId }}
            label="Cluster Roles"
            data-cy="k8sSidebar-clusterRoles"
            isSubMenu
          />
          <SidebarItem
            to="/:endpointId/kubernetes/moreResources/roles"
            params={{ endpointId: environmentId }}
            label="Roles"
            data-cy="k8sSidebar-Roles"
            isSubMenu
          />
        </Authorized>
      </SidebarParent>

      <SidebarParent
        label="Cluster"
        icon={Server}
        to="/:endpointId/kubernetes/cluster"
        params={{ endpointId: environmentId }}
        pathOptions={{ includePaths: ['/:endpointId/kubernetes/registries'] }}
        data-cy="k8sSidebar-cluster-area"
        listId="k8sSidebar-cluster-area"
      >
        <SidebarItem
          label="Details"
          to="/:endpointId/kubernetes/cluster"
          ignorePaths={['/:endpointId/kubernetes/cluster/configure']}
          params={{ endpointId: environmentId }}
          isSubMenu
          data-cy="k8sSidebar-cluster"
        />
        <Authorized
          authorizations="K8sClusterSetupRW"
          adminOnlyCE
          environmentId={environmentId}
        >
          <SidebarItem
            to="/:endpointId/kubernetes/cluster/configure"
            params={{ endpointId: environmentId }}
            label="Setup"
            isSubMenu
            data-cy="k8sSidebar-setup"
          />
        </Authorized>

        <SidebarItem
          to="/:endpointId/kubernetes/registries"
          params={{ endpointId: environmentId }}
          label="Registries"
          isSubMenu
          data-cy="k8sSidebar-registries"
        />
      </SidebarParent>
    </>
  );
}
