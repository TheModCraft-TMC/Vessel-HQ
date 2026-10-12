import { render } from '@testing-library/react';

import { UserViewModel } from '@/domains/users';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';

import { TeamAssociationSelector } from './TeamAssociationSelector';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(TeamAssociationSelector, user)
  );

  return render(<Wrapped users={[]} memberships={[]} teamId={3} />);
}
