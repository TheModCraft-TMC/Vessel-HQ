import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { terminalClose } from '@/core/realtime/terminal-window';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { Terminal } from '@/core/realtime/Terminal/Terminal';
import type { ShellState } from '@/core/realtime/Terminal/Terminal';

import { KubectlShellView } from './KubectlShellView';

vi.mock('@/core/realtime/Terminal/Terminal', () => ({
  Terminal: vi.fn(() => null),
  LINUX_SHELL_INIT_COMMANDS: [],
}));

vi.mock('@/core/routing/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/shared/browser-path', () => ({
  baseHref: vi.fn().mockReturnValue('/portainer/'),
}));

vi.mock('@/core/realtime/terminal-window', () => ({
  terminalClose: vi.fn(),
}));

function getTerminalProps() {
  return vi.mocked(Terminal).mock.calls[0][0] as {
    url: string;
    connect: boolean;
    onStateChange?: (state: ShellState) => void;
  };
}

function triggerStateChange(state: ShellState) {
  act(() => {
    getTerminalProps().onStateChange?.(state);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: {
      protocol: 'https:',
      host: 'localhost:3000',
      href: 'https://localhost:3000/',
    },
    writable: true,
  });
});

describe('KubectlShellView', () => {
  describe('URL construction', () => {
    it('builds wss:// URL when location is https', () => {
      renderComponent();
      expect(getTerminalProps().url).toBe(
        'wss://localhost:3000/portainer/api/websocket/kubernetes-shell?endpointId=1'
      );
    });

    it('builds ws:// URL when location is http', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
          host: 'localhost:3000',
          href: 'http://localhost:3000/',
        },
        writable: true,
      });
      renderComponent();
      expect(getTerminalProps().url).toBe(
        'ws://localhost:3000/portainer/api/websocket/kubernetes-shell?endpointId=1'
      );
    });

    it('passes connect=true to Terminal', () => {
      renderComponent();
      expect(getTerminalProps().connect).toBe(true);
    });
  });

  describe('shell state', () => {
    it('shows loading indicator when connecting', () => {
      renderComponent();
      triggerStateChange('connecting');
      expect(screen.getByText('Loading Terminal...')).toBeInTheDocument();
    });

    it('shows disconnected panel when disconnected', () => {
      renderComponent();
      triggerStateChange('disconnected');
      expect(screen.getByText('Console disconnected')).toBeInTheDocument();
    });

    it('calls terminalClose when state becomes disconnected', () => {
      renderComponent();
      triggerStateChange('disconnected');
      expect(vi.mocked(terminalClose)).toHaveBeenCalled();
    });

    it('shows nothing initially (idle state)', () => {
      renderComponent();
      expect(screen.queryByText('Loading Terminal...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Console disconnected')
      ).not.toBeInTheDocument();
    });
  });

  describe('disconnected buttons', () => {
    beforeEach(() => {
      renderComponent();
      triggerStateChange('disconnected');
    });

    it('renders Reload button', () => {
      expect(screen.getByTestId('k8sShell-reloadButton')).toHaveTextContent(
        'Reload'
      );
    });

    it('renders Close button', () => {
      expect(screen.getByTestId('k8sShell-closeButton')).toHaveTextContent(
        'Close'
      );
    });

    it('reloads page when Reload is clicked', async () => {
      const user = userEvent.setup();
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: mockReload },
        writable: true,
      });
      await user.click(screen.getByTestId('k8sShell-reloadButton'));
      expect(mockReload).toHaveBeenCalled();
    });

    it('closes window when Close is clicked', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      Object.defineProperty(window, 'close', {
        value: mockClose,
        writable: true,
      });
      await user.click(screen.getByTestId('k8sShell-closeButton'));
      expect(mockClose).toHaveBeenCalled();
    });
  });
});

function renderComponent() {
  const Wrapper = withTestQueryProvider(KubectlShellView);

  return render(<Wrapper />);
}
