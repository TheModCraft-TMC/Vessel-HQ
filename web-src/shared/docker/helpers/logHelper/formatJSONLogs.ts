import { without } from 'lodash';

import { splitTimestampPrefix } from './splitTimestampPrefix';
import { FormattedLine, Span, JSONLogs } from './types';
import {
  formatCaller,
  formatKeyValuePair,
  formatLevel,
  formatMessage,
  formatStackTrace,
  formatTime,
} from './formatters';

function removeKnownKeys(keys: string[]) {
  return without(keys, 'time', 'level', 'caller', 'message', 'stack_trace');
}

export function formatJSONLine(
  rawText: string,
  withTimestamps?: boolean
): FormattedLine[] {
  const spans: Span[] = [];
  const lines: FormattedLine[] = [];
  let line = '';

  const timestamp = withTimestamps ? splitTimestampPrefix(rawText) : undefined;
  if (withTimestamps && !timestamp) {
    return [{ line: rawText, spans: [{ text: rawText }] }];
  }
  const text = timestamp ? timestamp.text : rawText;

  const json: JSONLogs = JSON.parse(text);
  const { time, level, caller, message, stack_trace: stackTrace } = json;
  const keys = removeKnownKeys(Object.keys(json));

  if (timestamp) {
    spans.push({ text: timestamp.prefix });
  }
  line += formatTime(time, spans, line);
  line += formatLevel(level, spans, line);
  line += formatCaller(caller, spans, line);
  line += formatMessage(message, spans, line, !!keys.length);

  keys.forEach((key, idx) => {
    line += formatKeyValuePair(
      key,
      json[key],
      spans,
      line,
      idx === keys.length - 1
    );
  });

  // Add the original prefix once, outside the body formatters.
  lines.push({ line: `${timestamp?.prefix ?? ''}${line}`, spans });
  formatStackTrace(stackTrace, lines);

  return lines;
}
