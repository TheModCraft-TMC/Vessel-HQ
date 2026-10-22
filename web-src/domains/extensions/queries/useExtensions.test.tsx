import { cleanup, renderHook, waitFor } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { vi } from 'vitest';

import { getExtensions } from '../services/extensions.service';

import { useExtensions } from './useExtensions';

vi.mock('../services/extensions.service', () => ({ getExtensions: vi.fn() }));
const clients: QueryClient[] = [];

beforeEach(() => vi.clearAllMocks());

afterEach(async () => {
  cleanup();
  for (const client of clients.splice(0)) {
    await client.cancelQueries();
    client.clear();
  }
  onlineManager.setOnline(true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  vi.restoreAllMocks();
});

function renderApproval() {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
  });
  clients.push(client);
  client.setQueryData(['native-extensions'], [{ id: 7, status: 'approved' }]);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return renderHook(() => useExtensions(), { wrapper: Wrapper });
}

it('rechecks authority even when the application cache contains a fresh approval', async () => {
  let finish: ((records: []) => void) | undefined;
  vi.mocked(getExtensions).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const { result } = renderApproval();
  expect(getExtensions).toHaveBeenCalledOnce();
  expect(result.current.isFetching).toBe(true);
  finish?.([]);
  await waitFor(() => expect(result.current.data).toEqual([]));
});

it('fails closed on a network error while offline instead of serving cached approval as authority', async () => {
  vi.mocked(getExtensions).mockRejectedValue(
    new Error('Approval server unavailable')
  );
  onlineManager.setOnline(false);
  const { result } = renderApproval();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.isPaused).toBe(false);
  expect(getExtensions).toHaveBeenCalledTimes(1);
});
