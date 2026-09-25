import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { saveAs } from 'file-saver';
import { Download, FileText } from 'lucide-react';

import {
  concatLogsToString,
  openKubernetesLogsStream,
} from '@/docker/helpers/logHelper';
import { FormattedLine } from '@/docker/helpers/logHelper/types';
import { notifyError } from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Button } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { ViewLoading } from '@/ui/components/feedback/ViewLoading';

import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

import { getApplications } from '../queries/useApplications';
import { Application } from '../ListView/ApplicationsDatatable/types';

const colors = [
  'red',
  'orange',
  'lime',
  'green',
  'darkgreen',
  'cyan',
  'turquoise',
  'teal',
  'deepskyblue',
  'blue',
  'darkblue',
  'slateblue',
  'magenta',
  'darkviolet',
];

type Target = {
  namespace: string;
  podName: string;
  containerName: string;
  color?: string;
};

type LegacyPod = {
  Name: string;
  Namespace: string;
  Containers?: Array<{ Name: string }>;
};

type DisplayLine = FormattedLine & {
  source?: string;
  sourceColor?: string;
};

export function KubernetesLogsView() {
  const environmentId = useEnvironmentId();
  const { state, params } = useCurrentStateAndParams();
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');
  const isStack = state.name === 'kubernetes.stacks.stack.logs';
  const stackApplicationsQuery = useQuery(
    ['kubernetes-stack-log-targets', environmentId, namespace, name],
    () => getApplications(environmentId, { namespace }),
    {
      enabled: isStack,
      ...withError('Unable to retrieve stack applications'),
    }
  );
  const targets = useMemo(
    () =>
      isStack
        ? getStackTargets(stackApplicationsQuery.data || [], name)
        : [
            {
              namespace,
              podName: String(params.pod || ''),
              containerName: String(params.container || ''),
            },
          ],
    [
      isStack,
      name,
      namespace,
      params.container,
      params.pod,
      stackApplicationsQuery.data,
    ]
  );

  if (isStack && stackApplicationsQuery.isLoading) {
    return <ViewLoading message="Loading stack log streams..." />;
  }

  return (
    <LogsPage
      environmentId={environmentId}
      namespace={namespace}
      name={name}
      targets={targets}
      isStack={isStack}
    />
  );
}

function LogsPage({
  environmentId,
  namespace,
  name,
  targets,
  isStack,
}: {
  environmentId: number;
  namespace: string;
  name: string;
  targets: Target[];
  isStack: boolean;
}) {
  const [logsByTarget, setLogsByTarget] = useState<
    Record<string, FormattedLine[]>
  >({});
  const [live, setLive] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [lineCount, setLineCount] = useState(100);
  const [search, setSearch] = useState('');
  const logElement = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!live) {
      return undefined;
    }

    const streams = targets
      .filter(
        (target) => target.namespace && target.podName && target.containerName
      )
      .map((target) => {
        const targetId = keyForTarget(target);
        return openKubernetesLogsStream({
          environmentId,
          namespace: target.namespace,
          podName: target.podName,
          containerName: target.containerName,
          timestamps,
          since: 0,
          tail: lineCount,
          onLogs: (logs) =>
            setLogsByTarget((current) => ({ ...current, [targetId]: logs })),
          onError: (error) =>
            notifyError(
              'Failure',
              error,
              `Unable to stream logs for ${target.podName}/${target.containerName}`
            ),
        });
      });

    return () => streams.forEach((stream) => stream.close());
  }, [environmentId, lineCount, live, targets, timestamps]);

  const logs = useMemo(
    () =>
      targets.flatMap((target) =>
        (logsByTarget[keyForTarget(target)] || []).map((line) => ({
          ...line,
          source: isStack ? target.podName : undefined,
          sourceColor: target.color,
        }))
      ),
    [isStack, logsByTarget, targets]
  );
  const filteredLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          log.line.toLowerCase().includes(search.toLowerCase()) ||
          log.source?.toLowerCase().includes(search.toLowerCase())
      ),
    [logs, search]
  );

  useEffect(() => {
    if (live && logElement.current) {
      logElement.current.scrollTop = logElement.current.scrollHeight;
    }
  }, [filteredLogs, live]);

  return (
    <>
      <PageHeader
        title={isStack ? 'Stack logs' : 'Application logs'}
        breadcrumbs={
          isStack
            ? [
                { label: 'Namespaces', link: 'kubernetes.resourcePools' },
                {
                  label: namespace,
                  link: 'kubernetes.resourcePools.resourcePool',
                  linkParams: { id: namespace },
                },
                { label: 'Applications', link: 'kubernetes.applications' },
                'Stacks',
                name,
                'Logs',
              ]
            : [
                { label: 'Namespaces', link: 'kubernetes.resourcePools' },
                {
                  label: namespace,
                  link: 'kubernetes.resourcePools.resourcePool',
                  linkParams: { id: namespace },
                },
                { label: 'Applications', link: 'kubernetes.applications' },
                {
                  label: name,
                  link: 'kubernetes.applications.application',
                  linkParams: { name, namespace },
                },
                'Pods',
                targets[0]?.podName || '',
                'Containers',
                targets[0]?.containerName || '',
                'Logs',
              ]
        }
        reload
      />

      <Widget>
        <WidgetTitle icon={FileText} title="Log viewer settings" />
        <WidgetBody>
          <form className="form-horizontal">
            <SwitchRow
              label="Live log stream"
              checked={live}
              onChange={setLive}
              dataCy="kubernetes-logs-live-toggle"
              tooltip="Disabling this option pauses the WebSocket log stream and auto-scrolling."
            />
            <SwitchRow
              label="Wrap lines"
              checked={wrapLines}
              onChange={setWrapLines}
              dataCy="kubernetes-logs-wrap-toggle"
            />
            <SwitchRow
              label="Display timestamps"
              checked={timestamps}
              onChange={setTimestamps}
              dataCy="kubernetes-logs-timestamps-toggle"
            />
            <FormControl label="Search" inputId="logs_search">
              <Input
                id="logs_search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter..."
                data-cy="kubernetes-logs-search-input"
              />
            </FormControl>
            <FormControl label="Lines" inputId="logs_line_count">
              <Input
                id="logs_line_count"
                type="number"
                min={0}
                max={10_000}
                value={lineCount}
                onChange={(event) => setLineCount(Number(event.target.value))}
                data-cy="kubernetes-logs-line-count"
              />
            </FormControl>
            <FormControl label="Actions">
              <Button
                icon={Download}
                onClick={downloadLogs}
                data-cy="kubernetes-download-logs-button"
              >
                Download logs
              </Button>
            </FormControl>
          </form>
        </WidgetBody>
      </Widget>

      <div className="row h-[max(400px,calc(100vh-380px))]">
        <div className="col-sm-12 h-full">
          <pre
            ref={logElement}
            className={`log_viewer widget${wrapLines ? 'wrap_lines' : ''}`}
          >
            {filteredLogs.map((log, index) => (
              <LogLine key={`${index}-${log.source}-${log.line}`} log={log} />
            ))}
            {!filteredLogs.length && (
              <div className="line">
                <p className="inner_line">
                  {search
                    ? `No log line matching the '${search}' filter`
                    : 'No logs available'}
                </p>
              </div>
            )}
          </pre>
        </div>
      </div>
    </>
  );

  function downloadLogs() {
    saveAs(
      new Blob([
        concatLogsToString(filteredLogs, (line) => {
          const displayLine = line as DisplayLine;
          return displayLine.source
            ? `${displayLine.source} ${displayLine.line}`
            : displayLine.line;
        }),
      ]),
      `${name}_logs.txt`
    );
  }
}

function LogLine({ log }: { log: DisplayLine }) {
  if (!log.line) {
    return null;
  }

  return (
    <div className="line">
      <p className="inner_line">
        {log.source && (
          <span style={{ color: log.sourceColor, fontWeight: 'bold' }}>
            {log.source}{' '}
          </span>
        )}
        {log.spans.map((span, index) => (
          <span
            key={`${index}-${span.text}`}
            style={{
              color: span.fgColor,
              backgroundColor: span.bgColor,
              fontWeight: span.fontWeight,
            }}
          >
            {span.text}
          </span>
        ))}
      </p>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  dataCy,
  tooltip,
}: {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;
  dataCy: string;
  tooltip?: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          label={label}
          checked={checked}
          onChange={onChange}
          labelClass="col-sm-2"
          tooltip={tooltip}
          data-cy={dataCy}
        />
      </div>
    </div>
  );
}

function getStackTargets(applications: Application[], stackName: string) {
  return applications
    .filter((application) => application.StackName === stackName)
    .flatMap((application, applicationIndex) =>
      ((application.Pods || []) as unknown as LegacyPod[]).flatMap((pod) =>
        (pod.Containers || []).map((container) => ({
          namespace: pod.Namespace || application.ResourcePool,
          podName: pod.Name,
          containerName: container.Name,
          color: colors[applicationIndex % colors.length],
        }))
      )
    );
}

function keyForTarget(target: Target) {
  return `${target.namespace}/${target.podName}/${target.containerName}`;
}
