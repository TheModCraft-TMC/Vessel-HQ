import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { http, server } from '@/core/test-support/setup/server';

import { useSearch } from './useSearch';

it('searches an authorized source in CE when the caller enables browsing', async () => {
  const requested = vi.fn();
  server.use(
    http.post('/api/gitops/repo/files/search', async ({ request }) => {
      requested(await request.json());
      return HttpResponse.json(['deploy/compose.yml']);
    })
  );
  function Probe() {
    const query = useSearch(
      { sourceId: 7, keyword: 'compose', reference: 'refs/heads/main' },
      true
    );
    return <div>{query.data?.join(',')}</div>;
  }
  const Component = withTestQueryProvider(Probe);
  render(<Component />);
  await waitFor(() =>
    expect(screen.getByText('deploy/compose.yml')).toBeVisible()
  );
  expect(requested).toHaveBeenCalledWith({
    sourceId: 7,
    keyword: 'compose',
    reference: 'refs/heads/main',
  });
});

it('does not request repository data without a source', () => {
  function Probe() {
    const query = useSearch({ keyword: 'compose' }, true);
    return <div>{query.fetchStatus}</div>;
  }
  const Component = withTestQueryProvider(Probe);
  render(<Component />);
  expect(screen.getByText('idle')).toBeVisible();
});
