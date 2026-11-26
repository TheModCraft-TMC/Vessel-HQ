import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { openDockerLogsStream } from '@/shared/docker/helpers/logHelper';
import { notifyError } from '@/ui/components/toast/notifications';
import { DockerLogsView as ContainerLogsView } from '@app/_components/platform/docker/containers/ContainerLogs/DockerLogsView';

import { DockerLogsView as ServiceLogsView } from './DockerLogsView';

const scrollTo = vi.fn();

vi.mock('@/shared/docker/helpers/logHelper', () => ({
  openDockerLogsStream: vi.fn(),
  concatLogsToString: vi.fn(),
}));

vi.mock('@/ui/components/toast/notifications', () => ({
  notifyError: vi.fn(),
}));

beforeEach(() => {
  scrollTo.mockReset();
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: scrollTo,
  });

  function openStream({ onLogs }: Parameters<typeof openDockerLogsStream>[0]) {
    onLogs([
      { line: 'First log line', spans: [{ text: 'First log line' }] },
      { line: 'Second log line', spans: [{ text: 'Second log line' }] },
    ]);
    return { close: vi.fn() };
  }
  vi.mocked(openDockerLogsStream).mockReset().mockImplementation(openStream);
});

describe.each([
  ['container', ContainerLogsView],
  ['service and task', ServiceLogsView],
] as const)('%s log viewer', (_, LogsView) => {
  function renderLogs() {
    return render(
      <LogsView
        environmentId={1}
        resource="containers"
        resourceId="test-container"
        resourceName="test-container"
        multiplexed={false}
      />
    );
  }

  it('keeps the selected fetch window and uses it when opening a stream', async () => {
    const user = userEvent.setup();
    const now = vi.spyOn(Date, 'now');
    const timestamp = 1_800_000_000;
    now.mockReturnValue(timestamp * 1000);
    try {
      renderLogs();
      const fetch = screen.getByRole('combobox', { name: 'Fetch' });
      await user.selectOptions(fetch, '3600');
      expect(fetch).toHaveValue('3600');
      expect(openDockerLogsStream).toHaveBeenLastCalledWith(
        expect.objectContaining({ since: timestamp - 3600 })
      );

      now.mockReturnValue((timestamp + 60) * 1000);
      await user.click(
        screen.getByRole('checkbox', { name: 'Display timestamps' })
      );
      expect(fetch).toHaveValue('3600');
      expect(openDockerLogsStream).toHaveBeenLastCalledWith(
        expect.objectContaining({ since: timestamp + 60 - 3600 })
      );
    } finally {
      now.mockRestore();
    }
  });

  it('shows a stopped stream after failure and lets the user start it again', async () => {
    const user = userEvent.setup();
    renderLogs();
    const live = screen.getByRole('checkbox', { name: 'Live log stream' });
    const initialStream = vi.mocked(openDockerLogsStream).mock.lastCall?.[0];

    const error = new Error('Connection failed');
    act(() => initialStream?.onError(error));
    expect(notifyError).toHaveBeenCalledWith(
      'Failure',
      error,
      'Unable to stream containers logs'
    );
    expect(live).not.toBeChecked();

    await user.click(live);
    expect(live).toBeChecked();
    expect(openDockerLogsStream).toHaveBeenCalledTimes(2);
  });

  it('keeps the log viewer styles when toggling line wrapping', async () => {
    const user = userEvent.setup();
    renderLogs();
    const viewer = screen
      .getByRole('button', { name: 'First log line' })
      .closest('pre');

    expect(viewer).toHaveClass('log_viewer', 'scroll-smooth', 'wrap_lines');
    expect(viewer?.parentElement).toHaveClass(
      'h-[clamp(20rem,55vh,48rem)]',
      'overflow-hidden'
    );

    await user.click(screen.getByRole('checkbox', { name: 'Wrap lines' }));

    expect(viewer).toHaveClass('log_viewer');
    expect(viewer).not.toHaveClass('wrap_lines');
  });

  it('smoothly follows live output inside the bounded viewer', async () => {
    renderLogs();

    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    );
  });

  it('highlights selected lines and clears their highlights on unselect', async () => {
    const user = userEvent.setup();
    renderLogs();
    const firstLine = screen.getByRole('button', { name: 'First log line' });
    const secondLine = screen.getByRole('button', { name: 'Second log line' });
    const copySelected = screen.getByRole('button', {
      name: 'Copy selected lines',
    });

    expect(copySelected).toBeDisabled();
    await user.click(firstLine);

    expect(firstLine).toHaveClass('line_selected', 'text-left');
    expect(secondLine).not.toHaveClass('line_selected');
    expect(copySelected).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Unselect' }));

    expect(firstLine).not.toHaveClass('line_selected');
    expect(copySelected).toBeDisabled();
  });
});
