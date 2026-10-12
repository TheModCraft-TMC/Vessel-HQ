import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';

import { EnvironmentGroupId, Environment } from '@/domains/environments';
import { UserViewModel } from '@/domains/users';
import { Tag } from '@/domains/tags';
import { createMockEnvironment } from '@/core/test-support/test-mocks';
import { server } from '@/core/test-support/setup/server';
import { withTestRouter } from '@/core/test-support/withRouter';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { EnvironmentGroup } from '@/core/environment-management/environment-groups/types';

import { EnvironmentItem } from './EnvironmentItem';

test('loads component', async () => {
  const env = createMockEnvironment();
  const { getByText } = renderComponent(env);

  expect(getByText(env.Name)).toBeInTheDocument();
});

test('shows group name', async () => {
  const groupName = 'group-name';
  const groupId: EnvironmentGroupId = 14;

  const env = createMockEnvironment();
  env.GroupId = groupId;

  const { findByText } = renderComponent(env, { Name: groupName });

  await expect(findByText(groupName)).resolves.toBeVisible();
});

function renderComponent(
  env: Environment,
  group: Partial<EnvironmentGroup> = { Name: 'group' },
  isAdmin = false,
  tags: Tag[] = []
) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  server.use(http.get('/api/tags', () => HttpResponse.json(tags)));

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EnvironmentItem, user))
  );

  return render(
    <Wrapped
      isActive={false}
      onClickBrowse={() => {}}
      onClickDisconnect={() => {}}
      environment={env}
      groupName={group.Name}
    />
  );
}
