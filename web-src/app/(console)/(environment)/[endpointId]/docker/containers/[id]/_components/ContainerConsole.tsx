'use client';

import { useRouteParams } from '@console/routing/useRouteParams';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Terminal as TerminalIcon } from 'lucide-react';
import { PageContent } from '@console/layout/PageContent';

import {
  ContainerDetailsResponse,
  useContainer,
} from '@/domains/containers';
import { CONSOLE_COMMANDS_LABEL_PREFIX } from '@/shared/constants';
import { commandStringToArray } from '@/domains/containers/mappers/command';
import { baseHref } from '@/shared/browser-path';
import { withError } from '@/core/query';
import { createExec } from '@/domains/containers/queries/useCreateExecMutation';
import { resizeTTY as resizeContainerTTY } from '@/domains/containers/queries/useContainerResizeTTYMutation';
import { dockerClient } from '@/core/composition/dockerClient';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { Alert } from '@/ui/components/feedback/Alert';
import { ViewLoading } from '@/ui/components/feedback/ViewLoading';
import { Button } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { Select } from '@/ui/components/forms/Input/Select';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { Widget } from '@/ui/components/Widget';
import { WidgetBody } from '@/ui/components/Widget/WidgetBody';
import { WidgetTitle } from '@/ui/components/Widget/WidgetTitle';
import {
  isLinuxTerminalCommand,
  LINUX_SHELL_INIT_COMMANDS,
  ShellState,
  Terminal,
  TerminalDimensions,
} from '@/core/realtime/Terminal/Terminal';

type Mode = 'attach' | 'exec';

export function ContainerConsole({ mode }: { mode: Mode }) {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();
  const containerQuery = useContainer<ContainerDetailsResponse>(
    { environmentId, containerId, nodeName },
    { select: (container) => container }
  );
  const imageId = containerQuery.data?.Image || '';
  const imageQuery = useQuery(
    ['docker', environmentId, 'images', imageId],
    () => dockerClient.getImage<{ Os?: string }>(environmentId, imageId),
    {
      enabled: mode === 'exec' && Boolean(imageId),
      ...withError('Unable to retrieve image'),
    }
  );
  const [connect, setConnect] = useState(mode === 'attach');
  const [shellState, setShellState] = useState<ShellState>('idle');
  const [shellUrl, setShellUrl] = useState('');
  const [execId, setExecId] = useState('');
  const [customCommand, setCustomCommand] = useState(false);
  const [command, setCommand] = useState('');
  const [user, setUser] = useState('');
  const execMutation = useMutation(
    createExecRequest,
    withError('Unable to exec into container')
  );

  if (containerQuery.isLoading) {
    return <ViewLoading message="Loading container console..." />;
  }

  if (!containerQuery.data) {
    return null;
  }

  if (mode === 'exec' && imageQuery.isLoading) {
    return <ViewLoading message="Loading container image..." />;
  }

  if (mode === 'exec' && !imageQuery.data) {
    return null;
  }

  const container = containerQuery.data;
  const running = Boolean(container.State?.Running);
  const imageOS = imageQuery.data?.Os || 'linux';
  const commands = commandOptions(imageOS, container.Config?.Labels || {});
  const selectedCommand = command || commands[0]?.value || '';
  const activeCommand = customCommand ? command : selectedCommand;
  const url =
    mode === 'attach'
      ? buildShellUrl(
          'api/websocket/attach',
          environmentId,
          containerId,
          nodeName
        )
      : shellUrl;

  return (
    <PageContent>
      <Widget>
        <WidgetTitle
          icon={TerminalIcon}
          title={mode === 'attach' ? 'Attach' : 'Execute'}
        />
        <WidgetBody>
          {mode === 'attach' ? <AttachForm /> : <ExecForm />}
        </WidgetBody>
      </Widget>
      <div className="row h-[600px]">
        <div className="col-sm-12 h-full p-0">
          <Terminal
            fill
            url={url}
            connect={connect && running && Boolean(url)}
            onStateChange={handleStateChange}
            onResize={handleResize}
            initialCommands={
              mode === 'exec' && isLinuxTerminalCommand(activeCommand)
                ? LINUX_SHELL_INIT_COMMANDS
                : undefined
            }
          />
        </div>
      </div>
    </PageContent>
  );

  function AttachForm() {
    return (
      <>
        {!container.Config?.OpenStdin && (
          <Alert color="warn" title="Interactive input is disabled">
            The interactive flag is not set. The console may not work correctly.
          </Alert>
        )}
        {!container.Config?.Tty && (
          <Alert color="warn" title="TTY is disabled">
            The TTY flag is not set. The console may not work correctly.
          </Alert>
        )}
        {!running && (
          <Alert color="warn" title="Container is stopped">
            Start the container before attaching to it.
          </Alert>
        )}
        <Button
          onClick={() => setConnect((value) => !value)}
          disabled={!running || shellState === 'connecting'}
          data-cy="container-attach-button"
        >
          {connect ? 'Detach' : 'Attach to container'}
        </Button>
      </>
    );
  }

  function ExecForm() {
    if (connect) {
      return (
        <div className="flex items-center gap-3">
          <span>
            Exec into container as <code>{user || 'default user'}</code> using{' '}
            <code>{activeCommand}</code>
          </span>
          <Button
            onClick={() => setConnect(false)}
            data-cy="disconnect-exec-button"
          >
            {shellState === 'connecting' ? 'Connecting...' : 'Disconnect'}
          </Button>
        </div>
      );
    }

    return (
      <form className="form-horizontal" onSubmit={handleExec}>
        <FormControl label="Command" inputId="command">
          {customCommand ? (
            <Input
              id="command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="e.g. ps aux"
              data-cy="custom-command"
            />
          ) : (
            <Select
              id="command"
              value={selectedCommand}
              onChange={(event) => setCommand(event.target.value)}
              options={commands}
              data-cy="command-select"
            />
          )}
        </FormControl>
        <div className="form-group">
          <div className="col-sm-12">
            <SwitchField
              label="Use custom command"
              checked={customCommand}
              onChange={(value) => {
                setCustomCommand(value);
                setCommand('');
              }}
              labelClass="col-sm-2"
              data-cy="custom-command-toggle"
            />
          </div>
        </div>
        <FormControl
          label="User"
          inputId="exec-user"
          tooltip="Format: user, user:group, uid, or uid:gid"
        >
          <Input
            id="exec-user"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="root"
            data-cy="container-exec-user"
          />
        </FormControl>
        <Button
          type="submit"
          disabled={!running || !activeCommand || execMutation.isLoading}
          data-cy="connect-exec-button"
        >
          {execMutation.isLoading ? 'Connecting...' : 'Connect'}
        </Button>
        {!running && (
          <span className="text-danger ml-2">
            The container is not running.
          </span>
        )}
      </form>
    );
  }

  function handleExec(event: React.FormEvent) {
    event.preventDefault();
    execMutation.mutate();
  }

  async function createExecRequest() {
    const result = await createExec(environmentId, containerId, {
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      DetachKeys: '',
      Tty: true,
      Env: [],
      Cmd: commandStringToArray(activeCommand),
      Privileged: false,
      User: user,
      WorkingDir: '',
    });
    setExecId(result.Id);
    setShellUrl(
      buildShellUrl('api/websocket/exec', environmentId, result.Id, nodeName)
    );
    setConnect(true);
  }

  function handleStateChange(state: ShellState) {
    setShellState(state);
    if (state === 'disconnected') {
      setConnect(false);
    }
  }

  function handleResize({ rows, cols }: TerminalDimensions) {
    if (mode === 'attach') {
      resizeContainerTTY(environmentId, containerId, {
        width: cols,
        height: rows,
      });
    } else if (execId) {
      dockerClient.resizeExec(environmentId, execId, {
        width: cols,
        height: rows,
      });
    }
  }
}

function commandOptions(os: string, labels: Record<string, string>) {
  const builtIn =
    os === 'windows'
      ? [
          { label: 'powershell', value: 'powershell' },
          { label: 'cmd.exe', value: 'cmd.exe' },
        ]
      : ['ash', 'bash', 'dash', 'sh'].map((command) => ({
          label: `/bin/${command}`,
          value: command,
        }));
  const configured = Object.entries(labels)
    .filter(([label]) => label.startsWith(CONSOLE_COMMANDS_LABEL_PREFIX))
    .map(([label, value]) => ({
      label: `${label.slice(CONSOLE_COMMANDS_LABEL_PREFIX.length)}: ${value}`,
      value,
    }));
  return [...builtIn, ...configured];
}

function buildShellUrl(
  path: string,
  environmentId: number,
  id: string,
  nodeName?: string
) {
  const url = new URL(`${baseHref()}${path}`, window.location.origin);
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('endpointId', String(environmentId));
  url.searchParams.set('id', id);
  if (nodeName) {
    url.searchParams.set('nodeName', nodeName);
  }
  return url.toString();
}
