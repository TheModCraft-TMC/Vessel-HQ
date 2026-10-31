import { Meta, StoryFn } from '@storybook/react';
import { Clock, type LucideIcon } from 'lucide-react';

import { TestSidebarProvider } from '@/core/console/layout/SidebarState';

import { SidebarItem } from '.';

const meta: Meta = {
  title: 'Components/Sidebar/SidebarItem',
  component: SidebarItem,
  decorators: [
    (Story) => (
      <TestSidebarProvider>
        <Story />
      </TestSidebarProvider>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    if (!args.icon) return;
    const link = canvasElement.querySelector<HTMLAnchorElement>(
      '[data-cy="sidebar-item"]'
    );
    if (!link) throw new Error('Sidebar item was not rendered');
    const icon = link.querySelector('svg');
    const label = link.querySelector('span');
    if (!icon || !label) throw new Error('Sidebar icon or label missing');
    const expectedGap = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const actualGap =
      label.getBoundingClientRect().left - icon.getBoundingClientRect().right;
    if (actualGap < expectedGap - 1)
      throw new Error(
        `Sidebar icon/text gap is ${actualGap}px; expected at least ${expectedGap}px`
      );
  },
};
export default meta;

interface StoryProps {
  icon?: LucideIcon;
  label: string;
}

function Template({ icon, label }: StoryProps) {
  return (
    <ul className="sidebar">
      <SidebarItem
        to="example.path"
        params={{ endpointId: 1 }}
        icon={icon}
        label={label}
        data-cy="sidebar-item"
      />
    </ul>
  );
}

export const Primary: StoryFn<StoryProps> = Template.bind({});
Primary.args = {
  icon: Clock,
  label: 'Item with icon',
};

export const WithoutIcon: StoryFn<StoryProps> = Template.bind({});
WithoutIcon.args = {
  label: 'Item without icon',
};
