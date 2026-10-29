import { Fragment } from 'react';
import { QueryClient } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/core/test-support/setup/server';
import { withReactQuery } from '@/core/query/client/withReactQuery';

import { ActivityLogsView } from './ActivityLogsView';
import { useActivityLogs } from './useActivityLogs';

vi.mock('@/ui/layouts/view-layout/page-header', () => ({
  PageHeader: () => null,
}));
vi.mock('../components/DateRangePicker', () => ({
  DateRangePicker: ({
    onChange,
  }: {
    onChange: (range: { start: Date; end: Date }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ start: new Date('2026-10-01'), end: new Date('2026-10-02') })
      }
    >
      Change dates
    </button>
  ),
}));

function wrapper() {
  return withReactQuery(
    Fragment,
    new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
}

it('resets server pagination after search, page size and date changes', async () => {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get('/api/useractivity/logs', ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      return HttpResponse.json({
        logs: [
          {
            id: 1,
            timestamp: 1,
            username: 'alice',
            action: 'POST',
            context: 'test',
            payload: '',
          },
        ],
        totalCount: 100,
      });
    })
  );
  render(<ActivityLogsView />, { wrapper: wrapper() });
  await screen.findByText('alice');
  async function goToSecondPage() {
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(queries.at(-1)?.get('offset')).not.toBe('0'));
  }
  await goToSecondPage();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search input' }), {
    target: { value: 'alice' },
  });
  await waitFor(() => expect(queries.at(-1)?.get('keyword')).toBe('alice'));
  expect(queries.at(-1)?.get('offset')).toBe('0');
  await goToSecondPage();
  fireEvent.change(screen.getByLabelText('Items per page'), {
    target: { value: '25' },
  });
  await waitFor(() => expect(queries.at(-1)?.get('limit')).toBe('25'));
  expect(queries.at(-1)?.get('offset')).toBe('0');
  await goToSecondPage();
  fireEvent.click(screen.getByText('Change dates'));
  await waitFor(() => expect(queries.at(-1)?.get('after')).toBeTruthy());
  expect(queries.at(-1)?.get('offset')).toBe('0');
});

it('decodes UTF-8 JSON and plain text while preserving invalid base64', async () => {
  const unicode = 'Grüezi 世界 🐳';
  function encoded(value: string) {
    return btoa(String.fromCharCode(...new TextEncoder().encode(value)));
  }
  server.use(
    http.get('/api/useractivity/logs', () =>
      HttpResponse.json({
        logs: [
          JSON.stringify({ message: unicode }),
          unicode,
          'not base64!',
        ].map((value, id) => ({
          id,
          payload: id < 2 ? encoded(value) : value,
        })),
        totalCount: 3,
      })
    )
  );
  const { result } = renderHook(
    () => useActivityLogs({ offset: 0, limit: 10, keyword: '' }),
    { wrapper: wrapper() }
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.logs.map((log) => log.payload)).toEqual([
    { message: unicode },
    unicode,
    'not base64!',
  ]);
});
