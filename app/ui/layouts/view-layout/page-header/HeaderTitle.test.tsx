import { render } from '@testing-library/react';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';
import { withLayoutTestRouter } from '@/ui/layouts/test-utils';

import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';
import { PageTitle } from './PageTitle';

test('should display the page title via PageTitle and the user menu via HeaderTitle', async () => {
  const username = 'username';
  const title = 'title';

  const Wrapped = withLayoutTestRouter(() => (
    <>
      <HeaderContainer>
        <HeaderTitle />
      </HeaderContainer>
      <PageTitle title={title} />
    </>
  ));

  const { queryByText } = render(
    <TestLayoutProvider overrides={{ user: { Id: 1, Username: username } }}>
      <Wrapped />
    </TestLayoutProvider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
