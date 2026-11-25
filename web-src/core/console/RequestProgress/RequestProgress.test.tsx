import { act, cleanup, render, screen } from '@testing-library/react';

import { requestActivity } from '@/shared/http/request-activity';

import { RequestProgress, RouteLoadingActivity } from './RequestProgress';

const releases: (() => void)[] = [];

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  releases.splice(0).forEach((release) => release());
  vi.useRealTimers();
});

function begin() {
  let finish: () => void;
  act(() => {
    finish = requestActivity.begin();
    releases.push(finish);
  });
  return finish!;
}

it('does not flash for a fast request', () => {
  render(<RequestProgress />);
  const finish = begin();
  act(finish);
  act(() => vi.advanceTimersByTime(200));
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('shows an indeterminate bar for concurrent work and removes it on completion', () => {
  render(<RequestProgress />);
  const first = begin();
  const second = begin();
  act(() => vi.advanceTimersByTime(150));
  expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeVisible();
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  act(first);
  expect(screen.getByRole('progressbar')).toBeVisible();
  act(second);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

it('tracks the route fallback until it unmounts', () => {
  const view = render(
    <>
      <RequestProgress />
      <RouteLoadingActivity />
    </>
  );
  act(() => vi.advanceTimersByTime(150));
  expect(screen.getByRole('progressbar')).toBeVisible();
  view.rerender(<RequestProgress />);
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(requestActivity.getSnapshot()).toBe(false);
});
