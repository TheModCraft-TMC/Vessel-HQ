import { Meta } from '@storybook/react-webpack5';
import { RouteParamsProvider } from '@console/console/routing/useRouteParams';

import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta = {
  title: 'Components/PageHeader/Breadcrumbs',
  component: Breadcrumbs,
};

export default meta;

export { Example };

function Example() {
  return (
    <RouteParamsProvider params={{ id: '5' }}>
      <Breadcrumbs
        breadcrumbs={[
          { link: '/environments', label: 'Environments' },
          {
            label: 'endpointName',
            link: '/environments/:id',
            linkParams: { id: 5 },
          },
          { label: 'String item' },
        ]}
      />
    </RouteParamsProvider>
  );
}
