import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';

import { useHomeViewState } from '../../hooks/useHomeViewState';

import { EnvironmentHeader } from './EnvironmentHeader';

const { mockRouterReplace, mockSearchParams } = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockSearchParams: { current: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/environments',
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => mockSearchParams.current,
}));

const mockCounts = {
  total: 10,
  up: 7,
  down: 2,
  unassigned: 1,
};

function setupMocks(params: Record<string, unknown> = {}) {
  mockSearchParams.current = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
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
    mockRouterReplace.mockClear();
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
    expect(mockRouterReplace).toHaveBeenCalledWith(
      '/environments?groupBy=Health&groupFilter=Down&order=asc&page=0',
      { scroll: false }
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
    expect(mockRouterReplace).toHaveBeenCalledWith(
      '/environments?groupBy=Id&order=asc&page=0',
      { scroll: false }
    );
  });
});
