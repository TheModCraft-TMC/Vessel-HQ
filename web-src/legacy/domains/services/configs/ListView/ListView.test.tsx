import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { Role } from '@/domains/users';
import {
  createMockEnvironment,
  createMockUsers,
} from '@/react-tools/test-mocks';

import { ListView } from './ListView';

vi.mock('@/ui/components/links/Link', () => ({
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
