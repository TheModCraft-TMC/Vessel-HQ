import { Box } from 'lucide-react';

import { DashboardLink } from '../items/DashboardLink';
import { SidebarItem } from '../SidebarItem';

interface Props {
  environmentId: number;
}

export function AzureSidebar({ environmentId }: Props) {
  return (
    <>
      <DashboardLink
        environmentId={environmentId}
        platformPath="azure"
        data-cy="azureSidebar-dashboard"
      />
      <SidebarItem
        to="/:endpointId/azure/containerinstances"
        params={{ endpointId: environmentId }}
        icon={Box}
        label="Container instances"
        data-cy="azureSidebar-containerInstances"
      />
    </>
  );
}
