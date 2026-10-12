import { render } from '@testing-library/react';

import { UserViewModel } from '@/domains/users';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';

import { UsersList } from './UsersList';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(withUserProvider(UsersList, user));

  return render(<Wrapped users={[]} teamId={3} />);
}

test.todo('when users list is empty, add all users button is disabled');
test.todo('filter displays expected users');
