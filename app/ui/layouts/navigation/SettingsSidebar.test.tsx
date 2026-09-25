import { render, screen } from '@testing-library/react';

import {
  TestLayoutProvider,
  type LayoutSettings,
} from '@/ui/layouts/layout-context';
import { withLayoutTestRouter } from '@/ui/layouts/test-utils';

import { TestSidebarProvider } from './useSidebarState';
import { SettingsSidebar } from './SettingsSidebar';

describe('SettingsSidebar', () => {
  it('shows pure-admin navigation and hides CE-only licenses', () => {
    renderSettings({ isPureAdmin: true, isAdmin: true });

    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(
      screen.getByTestId('portainerSidebar-userRelated')
    ).toBeInTheDocument();
    expect(screen.getByTestId('portainerSidebar-settings')).toBeInTheDocument();
    expect(
      screen.queryByTestId('portainerSidebar-licenses')
    ).not.toBeInTheDocument();
  });

  it('shows team navigation without pure-admin sections', () => {
    renderSettings({ isTeamLeader: true });

    expect(
      screen.getByTestId('portainerSidebar-userRelated')
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('portainerSidebar-environments-area')
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('portainerSidebar-notifications')
    ).toBeInTheDocument();
  });

  it('shows edge update navigation only for BE settings', () => {
    renderSettings({
      isPureAdmin: true,
      isAdmin: true,
      isBE: true,
      settings: { EnableEdgeComputeFeatures: true },
    });

    expect(
      screen.getByTestId('portainerSidebar-updateSchedules')
    ).toBeInTheDocument();
  });
});

function renderSettings(
  overrides: Partial<React.ComponentProps<typeof SettingsSidebar>> & {
    isBE?: boolean;
    settings?: LayoutSettings;
  }
) {
  const { isBE, settings, ...sidebarProps } = overrides;
  const Wrapped = withLayoutTestRouter(SettingsSidebar);
  return render(
    <TestLayoutProvider overrides={{ isBE: isBE ?? false, settings }}>
      <TestSidebarProvider>
        <Wrapped
          isPureAdmin={sidebarProps.isPureAdmin ?? false}
          isAdmin={sidebarProps.isAdmin ?? false}
          isTeamLeader={sidebarProps.isTeamLeader}
        />
      </TestSidebarProvider>
    </TestLayoutProvider>
  );
}
