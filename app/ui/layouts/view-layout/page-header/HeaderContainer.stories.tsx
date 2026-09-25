import { Meta, StoryFn } from '@storybook/react-webpack5';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';

import { HeaderContainer } from './HeaderContainer';
import { Breadcrumbs } from './Breadcrumbs';
import { HeaderTitle } from './HeaderTitle';
import { PageTitle } from './PageTitle';

export default {
  component: HeaderContainer,
  title: 'Components/PageHeader/HeaderContainer',
} as Meta;

interface StoryProps {
  title: string;
}

function Template({ title }: StoryProps) {
  return (
    <TestLayoutProvider overrides={{ user: { Id: 1, Username: 'test' } }}>
      <HeaderContainer>
        <Breadcrumbs
          breadcrumbs={[
            { link: 'example', label: 'crumb1' },
            { label: 'crumb2' },
          ]}
        />

        <HeaderTitle />
      </HeaderContainer>
      <PageTitle title={title} />
    </TestLayoutProvider>
  );
}

export const Primary: StoryFn<StoryProps> = Template.bind({});
Primary.args = {
  title: 'Container details',
};
