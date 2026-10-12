import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestRouter } from '@/core/test-support/withRouter';
import { server } from '@/core/test-support/setup/server';
import { Role } from '@/domains/users';
import {
  createMockEnvironment,
  createMockUsers,
} from '@/core/test-support/test-mocks';

import { ListView } from './ListView';

vi.mock('@console/navigation/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
  }: {
    children: React.ReactNode;
    'data-cy'?: string;
  }) => (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a data-cy={dataCy}>{children}</a>
  ),
}));

function renderComponent() {
  const user = createMockUsers(1, Role.Admin)[0];

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ListView), user)
  );

  return render(<Wrapped />);
}

describe('ListView', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/endpoints/1', () =>
        HttpResponse.json(
          createMockEnvironment({ Id: 1, Name: 'test-environment', Type: 1 })
        )
      ),
      http.get('/api/endpoints/:environmentId/docker/configs', () =>
        HttpResponse.json([])
      )
    );
  });

  it('should render correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Configs' })).toBeVisible();
    });

    expect(
      screen.getByRole('heading', { name: 'Configs list', level: 1 })
    ).toBeVisible();
  });
});
