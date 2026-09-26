import { useEffect, useMemo, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import { Copy, Download, FileText, X } from 'lucide-react';

import {
  concatLogsToString,
  openDockerLogsStream,
} from '@/docker/helpers/logHelper';
import { FormattedLine } from '@/docker/helpers/logHelper/types';
import { notifyError } from '@/ui/components/toast/notifications';
import { Button } from '@/ui/components/buttons';
import { useCopy } from '@/ui/components/buttons/CopyButton/useCopy';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { Select } from '@/ui/components/forms/Input/Select';
import { SwitchField } from '@/ui/components/forms/SwitchField';

import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

interface Props {
  environmentId: number;
  resource: 'containers' | 'services' | 'tasks';
  resourceId: string;
  resourceName: string;
  nodeName?: string;
  multiplexed: boolean;
}

export function DockerLogsView({
  environmentId,
  resource,
  resourceId,
  resourceName,
  nodeName,
  multiplexed,
}: Props) {
  const [logs, setLogs] = useState<FormattedLine[]>([]);
  const [live, setLive] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [sinceTimestamp, setSinceTimestamp] = useState('');
  const [lineCount, setLineCount] = useState(100);
  const [search, setSearch] = useState('');
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const logElement = useRef<HTMLPreElement>(null);
  const filteredLogs = useMemo(
    () => logs.filter((log) => log.line.includes(search)),
    [logs, search]
  );
  const { handleCopy: copyAll } = useCopy(() =>
    filteredLogs.map((log) => log.line).join('\n')
  );
  const { handleCopy: copySelected } = useCopy(() => selectedLines.join('\n'));

  useEffect(() => {
    if (!live) {
      return undefined;
    }

    const parsedSince = sinceTimestamp
      ? Math.floor(new Date(sinceTimestamp).getTime() / 1000)
      : 0;
    const stream = openDockerLogsStream({
      environmentId,
      resource,
      resourceId,
      nodeName,
      timestamps,
      since: Number.isFinite(parsedSince) ? parsedSince : 0,
      tail: lineCount,
      multiplexed,
      onLogs: setLogs,
      onError: (error) =>
        notifyError('Failure', error, `Unable to stream ${resource} logs`),
    });

    return () => stream.close();
  }, [
    environmentId,
    lineCount,
    live,
    multiplexed,
    nodeName,
    resource,
    resourceId,
    sinceTimestamp,
    timestamps,
  ]);

  useEffect(() => {
    if (live && logElement.current) {
      logElement.current.scrollTop = logElement.current.scrollHeight;
    }
  }, [filteredLogs, live]);

  return (
    <>
      <Widget>
        <WidgetTitle icon={FileText} title="Log viewer settings" />
        <WidgetBody>
          <form className="form-horizontal">
            <SwitchRow
              label="Live log stream"
              checked={live}
              onChange={setLive}
              dataCy="logs-live-toggle"
              tooltip="Disabling this option pauses the WebSocket log stream and auto-scrolling."
            />
            <SwitchRow
              label="Wrap lines"
              checked={wrapLines}
              onChange={setWrapLines}
              dataCy="logs-wrap-toggle"
            />
            <SwitchRow
              label="Display timestamps"
              checked={timestamps}
              onChange={setTimestamps}
              dataCy="logs-timestamps-toggle"
            />
            <FormControl label="Fetch" inputId="logs_since">
              <Select
                id="logs_since"
                value={sinceTimestamp}
                onChange={(event) => setSinceTimestamp(event.target.value)}
                options={sinceOptions()}
                data-cy="logs-since-select"
              />
            </FormControl>
            <FormControl label="Search" inputId="logs_search">
              <Input
                id="logs_search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedLines([]);
                }}
                placeholder="Filter..."
                data-cy="logs-search-input"
              />
            </FormControl>
            <FormControl label="Lines" inputId="lines_count">
              <Input
                id="lines_count"
                type="number"
                min={0}
                value={lineCount}
                onChange={(event) => setLineCount(Number(event.target.value))}
                data-cy="logs-line-count"
              />
            </FormControl>
            <FormControl label="Actions">
              <div className="flex flex-wrap gap-2">
                <Button
                  icon={Download}
                  onClick={downloadLogs}
                  data-cy="download-logs-button"
                >
                  Download logs
                </Button>
                <Button
                  icon={Copy}
                  onClick={copyAll}
                  disabled={!filteredLogs.some((log) => log.line)}
                  data-cy="copy-logs-button"
                >
                  Copy
                </Button>
                <Button
                  icon={Copy}
                  onClick={copySelected}
                  disabled={!selectedLines.length}
                  data-cy="copy-selected-logs-button"
                >
                  Copy selected lines
                </Button>
                <Button
                  icon={X}
                  onClick={() => setSelectedLines([])}
                  disabled={!selectedLines.length}
                  data-cy="clear-selected-logs-button"
                >
                  Unselect
                </Button>
              </div>
            </FormControl>
          </form>
        </WidgetBody>
      </Widget>

      <div className="row h-[54%]">
        <div className="col-sm-12 h-full">
          <pre
            ref={logElement}
            className={`log_viewer${wrapLines ? 'wrap_lines' : ''}`}
          >
            {filteredLogs.map((log, index) =>
              log.line ? (
                <div className="line" key={`${index}-${log.line}`}>
                  <button
                    type="button"
                    className={`inner_line w-full border-0 bg-transparent text-left${
                      selectedLines.includes(log.line) ? 'line_selected' : ''
                    }`}
                    onClick={() => toggleLine(log.line)}
                  >
                    {log.spans.map((span, spanIndex) => (
                      <span
                        key={`${spanIndex}-${span.text}`}
                        style={{
                          color: span.fgColor,
                          backgroundColor: span.bgColor,
                          fontWeight: span.fontWeight,
                        }}
                      >
                        {span.text}
                      </span>
                    ))}
                  </button>
                </div>
              ) : null
            )}
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

  function toggleLine(line: string) {
    setSelectedLines((lines) =>
      lines.includes(line)
        ? lines.filter((selected) => selected !== line)
        : [...lines, line]
    );
  }

  function downloadLogs() {
    saveAs(
      new Blob([concatLogsToString(filteredLogs)]),
      `${resourceName}_logs.txt`
    );
  }
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

function sinceOptions() {
  const now = Date.now();
  return [
    { label: 'All logs', value: '' },
    { label: 'Last day', value: new Date(now - 86_400_000).toISOString() },
    { label: 'Last 4 hours', value: new Date(now - 14_400_000).toISOString() },
    { label: 'Last hour', value: new Date(now - 3_600_000).toISOString() },
    { label: 'Last 10 minutes', value: new Date(now - 600_000).toISOString() },
  ];
}
