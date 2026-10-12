import { act, render, screen } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { http, server } from '@/core/test-support/setup/server';
import { withUserProvider } from '@/core/test-support/withUserProvider';

import { EdgeAgentDeploymentWidget } from './EdgeAgentDeploymentWidget';

describe('EdgeAgentDeploymentWidget', () => {
  it('renders the deployment workflow and join token', async () => {
    await renderComponent({ edgeKey: 'test-edge-key-123' });

    expect(screen.getByText('Deploy an agent')).toBeVisible();
    expect(screen.getByText('Edge agent deployment script')).toBeVisible();
    expect(screen.getByText('Join token')).toBeVisible();
    expect(screen.getByText('test-edge-key-123')).toBeVisible();
    expect(screen.getByTestId('copy-edge-key-button')).toBeVisible();
  });

  it('asks for an Edge ID generator when no Edge ID is supplied', async () => {
    await renderComponent({ edgeKey: 'test-edge-key-123' });

    expect(
      screen.getByRole('textbox', { name: /Edge ID Generator/ })
    ).toBeVisible();
  });

  it('hides the Edge ID generator when an Edge ID is supplied', async () => {
    await renderComponent({
      edgeKey: 'test-edge-key-123',
      edgeId: 'edge-id-456',
    });

    expect(
      screen.queryByRole('textbox', { name: /Edge ID Generator/ })
    ).not.toBeInTheDocument();
  });

  it('offers Linux and Windows deployment commands', async () => {
    await renderComponent({ edgeKey: 'test-edge-key-123' });

    expect(screen.getByText('Linux & Windows WSL')).toBeVisible();
    expect(screen.getByText('Windows WCS')).toBeVisible();
  });

  it('decodes and displays valid edge connection details', async () => {
    const validKey = btoa('https://portainer.io|tunnel.example.com:8000');
    await renderComponent({ edgeKey: validKey });

    expect(screen.getByText(/https:\/\/portainer\.io/)).toBeVisible();
    expect(
      screen.getByText(/tcp:\/\/tunnel\.example\.com:8000/)
    ).toBeVisible();
  });

  it.each([
    ['invalid base64', 'invalid-base64!!!'],
    ['an empty key', ''],
    ['a key without a tunnel address', btoa('https://portainer.io')],
    ['a key containing only a delimiter', btoa('|')],
  ])('handles %s without crashing', async (_description, edgeKey) => {
    await renderComponent({ edgeKey });

    expect(screen.getByText('Deploy an agent')).toBeVisible();
    expect(screen.getByText('Edge agent deployment script')).toBeVisible();
  });

  it('uses the first two fields when the key has extra delimiters', async () => {
    const key = btoa(
      'https://portainer.io|tunnel.example.com:8000|ignored-value'
    );
    await renderComponent({ edgeKey: key });

    expect(screen.getByText(/https:\/\/portainer\.io/)).toBeVisible();
    expect(
      screen.getByText(/tcp:\/\/tunnel\.example\.com:8000/)
    ).toBeVisible();
    expect(screen.queryByText(/ignored-value/)).not.toBeInTheDocument();
  });
});

interface RenderOptions {
  edgeKey: string;
  edgeId?: string;
  asyncMode?: boolean;
}

async function renderComponent({ edgeKey, edgeId, asyncMode }: RenderOptions) {
  server.use(
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

  const Wrapper = withTestQueryProvider(
    withUserProvider(EdgeAgentDeploymentWidget)
  );

  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Wrapper edgeKey={edgeKey} edgeId={edgeId} asyncMode={asyncMode} />
    );
  });
  return result;
}
