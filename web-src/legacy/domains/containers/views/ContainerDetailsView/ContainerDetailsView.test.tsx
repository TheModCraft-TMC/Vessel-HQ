import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { createMockContainer, createMockUser } from '@/react-tools/test-mocks';
import { server } from '@/setup-tests/server';
import { User } from '@/domains/users';
import type { ContainerDetails } from '@/domains/containers/models';

import { ContainerDetailsView } from './ContainerDetailsView';

describe('ContainerDetailsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header with container details title', async () => {
    renderComponent();

    expect(
      await screen.findByRole('heading', {
        name: 'Container details',
        level: 1,
      })
    ).toBeVisible();
  });

  it('displays container name in breadcrumbs with leading slash trimmed', async () => {
    renderComponent();

    expect(await screen.findByText('test-container')).toBeVisible();
    expect(screen.queryByText('/test-container')).not.toBeInTheDocument();
  });

  it('renders health status section when container has health data', async () => {
    renderComponent({
      container: {
        State: {
          Health: {
            Status: 'healthy',
            FailingStreak: 0,
            Log: [
              {
                Start: '2024-01-01T00:00:00Z',
                End: '2024-01-01T00:00:01Z',
                ExitCode: 0,
                Output: 'Health check passed',
              },
            ],
          },
        },
      },
    });

    expect(await screen.findByText('Container health')).toBeVisible();
  });
});

function renderComponent({
  user = createMockUser({ Role: 1 }),
  container,
}: {
  user?: User;
  container?: Partial<ContainerDetails>;
} = {}) {
  server.use(
    http.get('/api/endpoints/:endpointId/docker/containers/:id/json', () =>
      HttpResponse.json(createMockContainer(container))
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(ContainerDetailsView, user))
  );

  return render(<Wrapped />);
}
