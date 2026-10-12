import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ReactNode } from 'react';
import { HttpResponse } from 'msw';
import { TestSidebarProvider } from '@console/layout/SidebarState';

import { http, server } from '@/core/test-support/setup/server';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withTestRouter } from '@/core/test-support/withRouter';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { UserViewModel } from '@/domains/users';

import { Workflow } from '../types';
import {
  mockWorkflowHealthy,
  mockWorkflowEmpty,
} from '../test-utils/workflow.mock';

import { ItemView } from './ItemView';

// Keep link rendering isolated from navigation behavior in this view test.
vi.mock('@console/navigation/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
    className,
  }: {
    children: ReactNode;
    'data-cy'?: string;
    className?: string;
  }) => (
    <a data-cy={dataCy} className={className} href="/">
      {children}
    </a>
  ),
}));

describe('ItemView', () => {
  it('renders the workflow name and status badge once loaded', async () => {
    renderComponent();

    expect(
      await screen.findByRole('heading', { name: mockWorkflowHealthy.name })
    ).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders the Overview tab sections with the fixture artifact', async () => {
    renderComponent();

    await screen.findByRole('heading', { name: mockWorkflowHealthy.name });

    expect(screen.getByText('Stacks')).toBeInTheDocument();
    expect(screen.getAllByText('Targets').length).toBeGreaterThan(0);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(
      (await screen.findAllByText('docker-compose.yml')).length
    ).toBeGreaterThan(0);
  });

  it('renders the empty state for a zero-artifact workflow', async () => {
    renderComponent(mockWorkflowEmpty);

    expect(
      await screen.findByRole('heading', { name: mockWorkflowEmpty.name })
    ).toBeInTheDocument();
    expect(screen.getAllByText('No artifacts').length).toBeGreaterThan(0);
    expect(screen.queryByText('Stacks')).not.toBeInTheDocument();
  });
});

function renderComponent(workflow: Workflow = mockWorkflowHealthy) {
  server.use(
    http.get(`/api/gitops/workflows/${workflow.id}`, () =>
      HttpResponse.json(workflow)
    )
  );

  const user = new UserViewModel({ Username: 'user', Role: 1 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(ItemView, {
        route: '/workflows/:workflowId',
        stateConfig: [
          {
            name: '/workflows/:workflowId',
            params: { workflowId: workflow.id },
          },
        ],
      }),
      user
    )
  );

  return render(
    <TestSidebarProvider>
      <Wrapped />
    </TestSidebarProvider>
  );
}
