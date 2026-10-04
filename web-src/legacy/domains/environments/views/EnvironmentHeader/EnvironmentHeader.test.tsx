import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';

import { useHomeViewState } from '../../hooks/useHomeViewState';

import { EnvironmentHeader } from './EnvironmentHeader';

vi.mock(
  '@console/console/routing/useRouteParams',
  async (importOriginal: () => Promise<object>) => ({
    ...(await importOriginal()),
    useRouteParams: vi.fn(),
  })
);

const mockCounts = {
  total: 10,
  up: 7,
  down: 2,
  unassigned: 1,
};

const mockGo = vi.fn();

function setupMocks(params: Record<string, unknown> = {}) {
  vi.mocked(useRouteParams).mockReturnValue(params as Record<string, string>);
  vi.mocked(useRouter).mockReturnValue({
    push: mockGo,
  } as never);
}

function renderComponent() {
  function HeaderWithState() {
    return <EnvironmentHeader tableState={useHomeViewState()} />;
  }

  const Wrapped = withTestQueryProvider(HeaderWithState);
  return render(<Wrapped />);
}

function mockSummaryCounts(counts = mockCounts) {
  server.use(
    http.get('/api/endpoints/summary', () => HttpResponse.json(counts))
  );
}

describe('EnvironmentHeader', () => {
  beforeEach(() => {
    mockGo.mockClear();
    setupMocks();
  });

  it('renders all status segments with counts', async () => {
    mockSummaryCounts();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /filter by up/i })
      ).toBeVisible();
    });

    expect(
      screen.getByRole('radio', { name: /filter by total/i })
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by down/i })
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by unassigned/i })
    ).toBeVisible();
  });

  it('navigates with correct params when Down segment is clicked', async () => {
    const user = userEvent.setup();
    mockSummaryCounts();
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /filter by down/i })
      ).toBeVisible();
    });

    await user.click(screen.getByRole('radio', { name: /filter by down/i }));
    expect(mockGo).toHaveBeenCalledWith(
      '.',
      expect.objectContaining({
        groupBy: 'Health',
        groupFilter: 'Down',
        page: 0,
        search: '',
      }),
      { reload: false, location: 'replace' }
    );
  });

  it('clears params when Total is clicked while a filter is active', async () => {
    const user = userEvent.setup();
    mockSummaryCounts();
    setupMocks({ groupBy: 'health', groupFilter: 'up' });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /filter by total/i })
      ).toBeVisible();
    });

    await user.click(screen.getByRole('radio', { name: /filter by total/i }));
    expect(mockGo).toHaveBeenCalledWith(
      '.',
      expect.objectContaining({
        groupBy: 'Id',
        groupFilter: null,
        page: 0,
        search: '',
      }),
      { reload: false, location: 'replace' }
    );
  });
});
