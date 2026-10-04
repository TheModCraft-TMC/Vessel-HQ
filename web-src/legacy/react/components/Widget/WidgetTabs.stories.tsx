import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Box, Settings, Users } from 'lucide-react';
import { RouteParamsProvider } from '@console/console/routing/useRouteParams';

import { WidgetTabs, Tab } from './WidgetTabs';

function withRouter(Story: () => React.JSX.Element) {
  return (
    <RouteParamsProvider params={{}}>
      <Story />
    </RouteParamsProvider>
  );
}

const meta: Meta<typeof WidgetTabs> = {
  title: 'Components/Widget/WidgetTabs',
  component: WidgetTabs,
  decorators: [withRouter],
};

export default meta;

const defaultTabs: Tab[] = [
  {
    name: 'Overview',
    widget: <div>Overview content</div>,
    selectedTabParam: 'overview',
  },
  {
    name: 'Settings',
    widget: <div>Settings content</div>,
    selectedTabParam: 'settings',
  },
  {
    name: 'Users',
    widget: <div>Users content</div>,
    selectedTabParam: 'users',
  },
];

const tabsWithIcons: Tab[] = [
  {
    name: 'Overview',
    icon: Box,
    widget: <div>Overview content</div>,
    selectedTabParam: 'overview',
  },
  {
    name: 'Settings',
    icon: Settings,
    widget: <div>Settings content</div>,
    selectedTabParam: 'settings',
  },
  {
    name: 'Users',
    icon: Users,
    widget: <div>Users content</div>,
    selectedTabParam: 'users',
  },
];

interface StoryArgs {
  currentTabIndex: number;
  tabs: Tab[];
  useContainer?: boolean;
}

function Template({ currentTabIndex, tabs, useContainer }: StoryArgs) {
  return (
    <WidgetTabs
      currentTabIndex={currentTabIndex}
      tabs={tabs}
      useContainer={useContainer}
    />
  );
}

export const Default: StoryFn<StoryArgs> = Template.bind({});
Default.args = {
  currentTabIndex: 0,
  tabs: defaultTabs,
};

export const WithIcons: StoryFn<StoryArgs> = Template.bind({});
WithIcons.args = {
  currentTabIndex: 0,
  tabs: tabsWithIcons,
};

export const SecondTabSelected: StoryFn<StoryArgs> = Template.bind({});
SecondTabSelected.args = {
  currentTabIndex: 1,
  tabs: tabsWithIcons,
};

export const WithoutContainer: StoryFn<StoryArgs> = Template.bind({});
WithoutContainer.args = {
  currentTabIndex: 0,
  tabs: tabsWithIcons,
  useContainer: false,
};

export const TwoTabs: StoryFn<StoryArgs> = Template.bind({});
TwoTabs.args = {
  currentTabIndex: 0,
  tabs: [
    {
      name: 'Tab 1',
      widget: <div>Tab 1 content</div>,
      selectedTabParam: 'tab1',
    },
    {
      name: 'Tab 2',
      widget: <div>Tab 2 content</div>,
      selectedTabParam: 'tab2',
    },
  ],
};
