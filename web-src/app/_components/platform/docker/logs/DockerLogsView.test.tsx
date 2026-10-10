import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { openDockerLogsStream as openServiceLogsStream } from '@/docker/helpers/logHelper';
import { DockerLogsView as ContainerLogsView } from '@app/_components/platform/docker/containers/ContainerLogs/DockerLogsView';
import { openDockerLogsStream } from '@app/_components/platform/docker/containers/ContainerLogs/logHelper';

import { DockerLogsView as ServiceLogsView } from './DockerLogsView';

vi.mock(
  '@app/_components/platform/docker/containers/ContainerLogs/logHelper',
  () => ({
    openDockerLogsStream: vi.fn(),
    concatLogsToString: vi.fn(),
  })
);

vi.mock('@/docker/helpers/logHelper', () => ({
  openDockerLogsStream: vi.fn(),
  concatLogsToString: vi.fn(),
}));

beforeEach(() => {
  function openStream({ onLogs }: Parameters<typeof openDockerLogsStream>[0]) {
    onLogs([
      { line: 'First log line', spans: [{ text: 'First log line' }] },
      { line: 'Second log line', spans: [{ text: 'Second log line' }] },
    ]);
    return { close: vi.fn() };
  }
  vi.mocked(openDockerLogsStream).mockImplementation(openStream);
  vi.mocked(openServiceLogsStream).mockImplementation(openStream);
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

  it('keeps the log viewer styles when toggling line wrapping', async () => {
    const user = userEvent.setup();
    renderLogs();
    const viewer = screen
      .getByRole('button', { name: 'First log line' })
      .closest('pre');

    expect(viewer).toHaveClass('log_viewer', 'wrap_lines');

    await user.click(screen.getByRole('checkbox', { name: 'Wrap lines' }));

    expect(viewer).toHaveClass('log_viewer');
    expect(viewer).not.toHaveClass('wrap_lines');
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
