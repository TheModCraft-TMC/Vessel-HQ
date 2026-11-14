import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { server, http } from '@/core/test-support/setup/server';

import { RefSelector } from './RefSelector';

it('preserves an explicit unadvertised reference without rewriting the deployment', async () => {
  server.use(
    http.post('/api/gitops/repo/refs', () =>
      HttpResponse.json(['refs/heads/develop', 'refs/heads/main'])
    )
  );
  const onChange = vi.fn();
  const Component = withTestQueryProvider(RefSelector);
  render(
    <Component inputId="ref" sourceId={7} value="abc1234" onChange={onChange} />
  );
  await waitFor(() => expect(screen.getByText('abc1234')).toBeVisible());
  expect(onChange).not.toHaveBeenCalled();
});

it('preserves HEAD when no explicit reference was configured', async () => {
  server.use(
    http.post('/api/gitops/repo/refs', () =>
      HttpResponse.json(['refs/heads/main'])
    )
  );
  const onChange = vi.fn();
  const Component = withTestQueryProvider(RefSelector);
  render(<Component inputId="ref" sourceId={7} value="" onChange={onChange} />);
  await waitFor(() =>
    expect(screen.getByText('HEAD (default branch)')).toBeVisible()
  );
  expect(onChange).not.toHaveBeenCalled();
});
