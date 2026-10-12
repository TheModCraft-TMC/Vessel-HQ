import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { server } from '@/core/test-support/setup/server';

import { useContainer } from './useContainer';

function renderContainerQuery(enabled?: boolean) {
  const Wrapper = withTestQueryProvider(({ children }) => <>{children}</>);

  return renderHook(
    () =>
      useContainer(
        { environmentId: 1, containerId: 'container-1' },
        { enabled }
      ),
    { wrapper: Wrapper }
  );
}

describe('useContainer', () => {
  it('fetches by default when a container id is available', async () => {
    const inspect = vi.fn(() =>
      HttpResponse.json({ Id: 'container-1', Name: '/container-1' })
    );
    server.use(
      http.get(
        '/api/endpoints/1/docker/containers/container-1/json',
        inspect
      )
    );

    const { result } = renderContainerQuery();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inspect).toHaveBeenCalledOnce();
    expect(result.current.data?.Id).toBe('container-1');
  });

  it('does not fetch when explicitly disabled', async () => {
    const inspect = vi.fn(() => HttpResponse.json({ Id: 'container-1' }));
    server.use(
      http.get(
        '/api/endpoints/1/docker/containers/container-1/json',
        inspect
      )
    );

    const { result } = renderContainerQuery(false);

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(inspect).not.toHaveBeenCalled();
  });
});
