'use client';

import { useState } from 'react';

import { EnvironmentId } from '@/domains/environments';
import { baseHref } from '@/shared/browser-path';
import { terminalClose } from '@/core/realtime/terminal-window';
import { isVersionSmaller } from '@/shared/semver';
import { useEnvironment } from '@/domains/environments';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { Button } from '@/ui/components/buttons';
import { Alert } from '@/ui/components/feedback/Alert';
import {
  LINUX_SHELL_INIT_COMMANDS,
  ShellState,
  Terminal,
} from '@/core/realtime/Terminal/Terminal';

const RESIZE_LAST_UNSUPPORTED_AGENT_VERSION = '2.40.0';

export function useKubernetesShell() {
  const environmentId = useEnvironmentId();
  const [shellState, setShellState] = useState<ShellState>('idle');
  const { data: agentVersion } = useEnvironment(
    environmentId,
    (env) => env.Agent.Version
  );
  const supportsResize =
    !!agentVersion &&
    isVersionSmaller(RESIZE_LAST_UNSUPPORTED_AGENT_VERSION, agentVersion);

  return {
    environmentId,
    shellState,
    supportsResize,
    onStateChange(state: ShellState) {
      if (state === 'disconnected') terminalClose();
      setShellState(state);
    },
  };
}

export function KubernetesShellStatus({ state }: { state: ShellState }) {
  if (state === 'connecting')
    return <div className="px-4 pt-2">Loading Terminal...</div>;
  if (state !== 'disconnected') return null;
  return (
    <div className="p-4">
      <Alert color="info" title="Console disconnected">
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={() => window.location.reload()}
            data-cy="k8sShell-reloadButton"
          >
            Reload
          </Button>
          <Button
            onClick={() => window.close()}
            color="default"
            data-cy="k8sShell-closeButton"
          >
            Close
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export function KubectlTerminal({
  environmentId,
  supportsResize,
  onStateChange,
}: {
  environmentId: EnvironmentId;
  supportsResize: boolean;
  onStateChange(state: ShellState): void;
}) {
  return (
    <Terminal
      fill
      url={buildUrl(environmentId)}
      connect
      onStateChange={onStateChange}
      initialCommands={[
        ...LINUX_SHELL_INIT_COMMANDS,
        '# Run kubectl commands inside here\n',
        '# e.g. kubectl get all\n',
        '',
      ]}
      onResize={supportsResize ? 'socket' : null}
    />
  );
}

function buildUrl(environmentId: EnvironmentId) {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const path = `${baseHref()}api/websocket/kubernetes-shell`;
  const base = path.startsWith('http')
    ? path.replace(/^https?:\/\//i, '')
    : window.location.host + path;
  return `${protocol}${base}?endpointId=${environmentId}`;
}
