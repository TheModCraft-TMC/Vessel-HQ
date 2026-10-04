import { render } from '@testing-library/react';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';
import { withLayoutTestRouter } from '@/ui/layouts/test-utils';

import { PageHeader } from './PageHeader';

test('should display a PageHeader', async () => {
  const username = 'username';
  const Wrapped = withLayoutTestRouter(PageHeader);

  const title = 'title';
  const { queryByText } = render(
    <TestLayoutProvider overrides={{ user: { Id: 1, Username: username } }}>
      <Wrapped title={title} />
    </TestLayoutProvider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
