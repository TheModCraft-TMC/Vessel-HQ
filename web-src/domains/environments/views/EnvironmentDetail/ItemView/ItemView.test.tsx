import { act, render, screen } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { http, server } from '@/core/test-support/setup/server';
import { createMockEnvironment } from '@/core/test-support/test-mocks';
import { withTestRouter } from '@/core/test-support/withRouter';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import {
  Environment,
  EnvironmentStatus,
  EnvironmentType,
} from '@/domains/environments';

import { ItemView } from './ItemView';

describe('ItemView', () => {
  it('renders the environment page header and editable details', async () => {
    await renderComponent(
      createMockEnvironment({
        Name: 'Test Environment',
        Type: EnvironmentType.Docker,
        Status: EnvironmentStatus.Up,
      })
    );

    expect(
      await screen.findByRole('heading', { name: 'Environment details' })
    ).toBeVisible();
    expect(screen.getByText('Test Environment')).toBeVisible();
    expect(screen.getByText('Configuration')).toBeVisible();
    expect(screen.getByDisplayValue('Test Environment')).toBeVisible();
  });

  it('renders association details for a connected Edge environment', async () => {
    await renderComponent(
      createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: 'edge-123',
        EdgeKey: 'edge-key-123',
      })
    );

    expect(await screen.findByText('Edge information')).toBeVisible();
    expect(screen.getByText('edge-key-123')).toBeVisible();
    expect(screen.getByText('edge-123')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Disassociate' })).toBeVisible();
  });

  it('renders deployment instructions for an unconnected Edge environment', async () => {
    await renderComponent(
      createMockEnvironment({
        Type: EnvironmentType.EdgeAgentOnDocker,
        EdgeID: undefined,
        EdgeKey: 'edge-key-456',
        Edge: {
          AsyncMode: true,
          PingInterval: 30,
          SnapshotInterval: 60,
          CommandInterval: 10,
        },
      })
    );

    expect(await screen.findByText('Deploy an agent')).toBeVisible();
    expect(screen.getByText('Edge agent deployment script')).toBeVisible();
    expect(screen.getByText('edge-key-456')).toBeVisible();
  });

  it('only renders Kubernetes configuration for Kubernetes environments', async () => {
    const docker = await renderComponent(
      createMockEnvironment({ Type: EnvironmentType.Docker })
    );
    await screen.findByRole('heading', { name: 'Environment details' });
    expect(
      screen.queryByText('Kubernetes features configuration')
    ).not.toBeInTheDocument();
    docker.unmount();

    await renderComponent(
      createMockEnvironment({
        Type: EnvironmentType.KubernetesLocal,
        Status: EnvironmentStatus.Up,
      })
    );
    expect(
      await screen.findByText('Kubernetes features configuration')
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Kubernetes configuration' })
    ).toBeVisible();
  });
});

async function renderComponent(environment: Environment) {
  server.use(
    http.get('/api/endpoints/:id', ({ params }) =>
      HttpResponse.json({ ...environment, Id: Number(params.id) })
    ),
    http.get('/api/settings', () =>
      HttpResponse.json({ AgentSecret: 'test-agent-secret' })
    ),
    http.get('/api/system/status', () =>
      HttpResponse.json({
        Edition: 'CE',
        Version: '2.33.0',
        InstanceID: 'test-instance',
      })
    )
  );

  const Wrapped = withTestQueryProvider<{ environmentId?: number }>(
    withUserProvider(withTestRouter<{ environmentId?: number }>(ItemView))
  );

  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<Wrapped environmentId={1} />);
  });
  return result;
}
