import { Box, Clock, LayoutGrid, Layers, Puzzle, Edit } from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { SidebarParent } from './SidebarItem/SidebarParent';

export function EdgeComputeSidebar() {
  const { isBE, settings } = useLayoutBindings();

  if (!settings?.EnableEdgeComputeFeatures) {
    return null;
  }

  return (
    <SidebarSection title="Edge compute">
      <SidebarItem
        to="edge.groups"
        label="Edge Groups"
        icon={LayoutGrid}
        data-cy="portainerSidebar-edgeGroups"
      />
      <SidebarItem
        to="edge.stacks"
        label="Edge Stacks"
        icon={Layers}
        data-cy="portainerSidebar-edgeStacks"
      />
      <SidebarItem
        to="edge.jobs"
        label="Edge Jobs"
        icon={Clock}
        data-cy="portainerSidebar-edgeJobs"
      />
      {isBE && (
        <SidebarItem
          to="edge.configurations"
          label="Edge Configurations"
          icon={Puzzle}
          data-cy="portainerSidebar-edgeConfigurations"
        />
      )}
      {isBE && !settings.TrustOnFirstConnect && (
        <SidebarItem
          to="edge.devices.waiting-room"
          label="Waiting Room"
          icon={Box}
          data-cy="portainerSidebar-edgeDevicesWaitingRoom"
        />
      )}
      <SidebarParent
        icon={Edit}
        label="Edge Templates"
        to="edge.templates"
        data-cy="edgeSidebar-templates"
        listId="edgeSidebar-templates"
      >
        <SidebarItem
          label="Application"
          to="edge.templates"
          ignorePaths={['edge.templates.custom']}
          isSubMenu
          data-cy="edgeSidebar-appTemplates"
        />
        <SidebarItem
          label="Custom"
          to="edge.templates.custom"
          isSubMenu
          data-cy="edgeSidebar-customTemplates"
        />
      </SidebarParent>
    </SidebarSection>
  );
}
