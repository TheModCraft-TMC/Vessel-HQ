import { render, screen } from '@testing-library/react';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';
import { withLayoutTestRouter } from '@/ui/layouts/test-utils';

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders primary navigation for a standard user', () => {
    renderSidebar({ isAdmin: false, isPureAdmin: false });

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeVisible();
    expect(screen.getByText('Home')).toBeVisible();
    expect(screen.getByText('App Delivery')).toBeVisible();
  });

  it('renders administration navigation for an administrator', () => {
    renderSidebar({ isAdmin: true, isPureAdmin: true });

    expect(screen.getByText('Administration')).toBeVisible();
    expect(screen.getByTestId('portainerSidebar-settings')).toBeVisible();
  });
});

function renderSidebar({
  isAdmin,
  isPureAdmin,
}: {
  isAdmin: boolean;
  isPureAdmin: boolean;
}) {
  const WrappedSidebar = withLayoutTestRouter(Sidebar);

  return render(
    <TestLayoutProvider
      overrides={{
        isAdmin,
        isPureAdmin,
        publicSettings: {},
        logos: {
          full: 'vessel-hq-logo.svg',
          collapsed: 'vessel-hq-mark.svg',
        },
      }}
    >
      <WrappedSidebar />
    </TestLayoutProvider>
  );
}
