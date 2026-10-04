import {
  Users,
  Award,
  Settings,
  HardDrive,
  Radio,
  FileText,
  Bell,
} from 'lucide-react';

import { useLayoutBindings } from '@/ui/layouts/layout-context';

import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import { SidebarParent } from './SidebarItem/SidebarParent';

interface Props {
  isPureAdmin: boolean;
  isAdmin: boolean;
  isTeamLeader?: boolean;
}

export function SettingsSidebar({
  isPureAdmin,
  isAdmin,
  isTeamLeader = false,
}: Props) {
  const { isBE, ddExtension } = useLayoutBindings();
  const isPureAdminOrTeamLeader = isPureAdmin || (isTeamLeader && !isAdmin);
  const showUsersSection = !ddExtension && isPureAdminOrTeamLeader;

  return (
    <SidebarSection title="Administration">
      {showUsersSection && (
        <SidebarParent
          label="User-related"
          icon={Users}
          to="/users"
          pathOptions={{ includePaths: ['/teams', '/roles'] }}
          data-cy="portainerSidebar-userRelated"
          listId="portainerSidebar-userRelated"
        >
          <SidebarItem
            to="/users"
            label="Users"
            isSubMenu
            data-cy="portainerSidebar-users"
          />
          <SidebarItem
            to="/teams"
            label="Teams"
            isSubMenu
            data-cy="portainerSidebar-teams"
          />

          {isPureAdmin && (
            <SidebarItem
              to="/roles"
              label="Roles"
              isSubMenu
              data-cy="portainerSidebar-roles"
            />
          )}
        </SidebarParent>
      )}
      {isPureAdmin && (
        <>
          <SidebarParent
            label="Environment-related"
            icon={HardDrive}
            to="/environments"
            pathOptions={{
              includePaths: ['/environments/new', '/groups', '/tags'],
            }}
            data-cy="portainerSidebar-environments-area"
            listId="portainer-environments"
          >
            <SidebarItem
              label="Environments"
              to="/environments"
              ignorePaths={['/update-schedules']}
              includePaths={['/environments/new']}
              isSubMenu
              data-cy="portainerSidebar-environments"
            />
            <SidebarItem
              to="/groups"
              label="Groups"
              isSubMenu
              data-cy="portainerSidebar-environmentGroups"
            />
            <SidebarItem
              to="/tags"
              label="Tags"
              isSubMenu
              data-cy="portainerSidebar-environmentTags"
            />
            <EdgeUpdatesSidebarItem />
          </SidebarParent>

          <SidebarItem
            label="Registries"
            to="/registries"
            icon={Radio}
            data-cy="portainerSidebar-registries"
          />

          {isBE && (
            <SidebarItem
              to="/licenses"
              label="Licenses"
              icon={Award}
              data-cy="portainerSidebar-licenses"
            />
          )}

          <SidebarItem
            label="Activity logs"
            to="/activity-logs"
            icon={FileText}
            data-cy="portainerSidebar-activityLogs"
          />
        </>
      )}
      {isBE && !isPureAdmin && isAdmin && (
        <SidebarParent
          label="Environment-related"
          icon={HardDrive}
          to="/update-schedules"
          data-cy="portainerSidebar-environments-area"
          listId="portainer-environments-area"
        >
          <EdgeUpdatesSidebarItem />
        </SidebarParent>
      )}

      <SidebarItem
        to="/notifications"
        icon={Bell}
        label="Notifications"
        data-cy="portainerSidebar-notifications"
      />
      {isPureAdmin && (
        <SidebarParent
          to="/settings"
          label="Settings"
          icon={Settings}
          data-cy="portainerSidebar-settings"
          listId="portainer-settings"
        >
          <SidebarItem
            to="/settings"
            label="General"
            isSubMenu
            ignorePaths={[
              '/settings/authentication',
              '/settings/shared-credentials',
              '/settings/edge-compute',
            ]}
            data-cy="portainerSidebar-generalSettings"
          />
          {!ddExtension && (
            <SidebarItem
              to="/settings/authentication"
              label="Authentication"
              isSubMenu
              data-cy="portainerSidebar-authentication"
            />
          )}
          {isBE && (
            <SidebarItem
              to="/settings/shared-credentials"
              label="Shared Credentials"
              isSubMenu
              data-cy="portainerSidebar-cloud"
            />
          )}

          <SidebarItem
            to="/settings/edge-compute"
            label="Edge Compute"
            isSubMenu
            data-cy="portainerSidebar-edgeCompute"
          />

          <SidebarItem.Wrapper label="Get Help">
            <a
              href="https://www.portainer.io/resources/get-support"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-full items-center rounded px-3 text-sm !text-inherit transition-colors duration-200 hover:bg-blue-5/20 hover:!underline focus:no-underline be:hover:bg-gray-5/20 th-dark:hover:bg-gray-true-5/20"
            >
              Get Help
            </a>
          </SidebarItem.Wrapper>
        </SidebarParent>
      )}
    </SidebarSection>
  );
}

function EdgeUpdatesSidebarItem() {
  const { isBE, settings } = useLayoutBindings();

  if (!isBE || !settings?.EnableEdgeComputeFeatures) {
    return null;
  }

  return (
    <SidebarItem
      to="/update-schedules"
      label="Update & Rollback"
      isSubMenu
      data-cy="portainerSidebar-updateSchedules"
    />
  );
}
