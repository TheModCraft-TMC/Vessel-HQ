import { Meta, StoryFn } from '@storybook/react-webpack5';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';

import { PageHeader } from './PageHeader';

export default {
  component: PageHeader,
  title: 'Components/PageHeader',
} as Meta;

interface StoryProps {
  title: string;
}

function Template({ title }: StoryProps) {
  return (
    <TestLayoutProvider overrides={{ user: { Id: 1, Username: 'test' } }}>
      <PageHeader
        title={title}
        breadcrumbs={[
          { link: 'example', label: 'bread1' },
          { link: 'example2', label: 'bread2' },
          { label: 'bread3' },
          { label: 'bread4' },
        ]}
        reload
      />
    </TestLayoutProvider>
  );
}

export const Primary: StoryFn<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
