import { Meta, StoryObj } from '@storybook/react';

import { StickyFooter } from '@/ui/components/StickyFooter/StickyFooter';
import { Button } from '@/ui/components/buttons';

import { TestLayoutProvider } from './LayoutContext';
import { SideNavigation } from './SideNavigation';
import { TestSidebarProvider } from './SidebarState';
import { SidebarToggleButton } from './SidebarToggleButton';
import styles from './MainLayout.module.css';

export default {
  component: SideNavigation,
  title: 'Console/MobileNavigation',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <TestLayoutProvider
        overrides={{
          publicSettings: {},
          logos: {
            full: '/images/vessel-hq-logo.svg',
            collapsed: '/images/vessel-hq-logo.svg',
          },
        }}
      >
        <TestSidebarProvider>
          <div className={styles.shell} data-sidebar-open>
            <Story />
            <header className={styles.header}>
              <SidebarToggleButton />
              <span>Mobile navigation preview</span>
            </header>
            <main className={styles.mainScroll}>
              <p className="p-4">
                Choose a route, press Escape, or tap outside to close the
                navigation.
              </p>
              <StickyFooter>
                <Button
                  color="primary"
                  data-cy="mobile-navigation-preview-save"
                >
                  Save preview
                </Button>
              </StickyFooter>
            </main>
          </div>
        </TestSidebarProvider>
      </TestLayoutProvider>
    ),
  ],
} satisfies Meta<typeof SideNavigation>;

type Story = StoryObj<typeof SideNavigation>;
export const Drawer: Story = {};
