import { splitTimestampPrefix } from './splitTimestampPrefix';
import {
  formatCaller,
  formatKeyValuePair,
  formatLevel,
  formatMessage,
  formatStackTrace,
  formatTime,
} from './formatters';
import { FormattedLine, JSONStackTrace, Level, Span } from './types';

const dateRegex = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}[AP]M) /; // "2022/02/01 04:30AM "
const levelRegex = /(\w{3})/; // "INF " or "ERR "
// The leading space delimits the caller token, avoiding retries within a long token.
const callerRegex = / (\S+\.go:\d+) /; // "path/to/file.go:line "
const chevRegex = /> /; // "> "
const messageAndPairsRegex = /(.*)/; // include the rest of the string in a separate group

// Tokenize once, then find the last equals sign in each token (linear time).
const pairTokenRegex = /\S+/g;

export const ZerologRegex = concatRegex(
  dateRegex,
  levelRegex,
  callerRegex,
  chevRegex,
  messageAndPairsRegex
);

function concatRegex(...regs: RegExp[]) {
  const flags = Array.from(
    new Set(
      regs
        .map((r) => r.flags)
        .join('')
        .split('')
    )
  ).join('');
  const source = regs.map((r) => r.source).join('');
  return new RegExp(source, flags);
}

type Pair = {
  key: string;
  value: string;
};

export function formatZerologLogs(rawText: string, withTimestamps?: boolean) {
  const spans: Span[] = [];
  const lines: FormattedLine[] = [];
  let line = '';

  const timestamp = withTimestamps ? splitTimestampPrefix(rawText) : undefined;
  if (withTimestamps && !timestamp) {
    return [{ line: rawText, spans: [{ text: rawText }] }];
  }
  const text = timestamp ? timestamp.text : rawText;

  if (timestamp) {
    spans.push({ text: timestamp.prefix });
  }

  const [, date, level, caller, messageAndPairs] =
    text.match(ZerologRegex) || [];

  const [message, pairs] = extractPairs(messageAndPairs);

  line = formatTime(date, spans, line);
  line = formatLevel(level as Level, spans, line);
  line = formatCaller(caller, spans, line);
  line = formatMessage(message, spans, line, !!pairs.length);

  let stackTrace: JSONStackTrace | undefined;
  const stackTraceIndex = pairs.findIndex((p) => p.key === 'stack_trace');

  if (stackTraceIndex !== -1) {
    stackTrace = JSON.parse(pairs[stackTraceIndex].value);
    pairs.splice(stackTraceIndex);
  }

  pairs.forEach(({ key, value }, idx) => {
    line = formatKeyValuePair(
      key,
      value,
      spans,
      line,
      idx === pairs.length - 1
    );
  });
  // Add the original prefix once, outside the body formatters.
  lines.push({ line: `${timestamp?.prefix ?? ''}${line}`, spans });

  formatStackTrace(stackTrace, lines);

  return lines;
}

function extractPairs(messageAndPairs: string): [string, Pair[]] {
  const pairs: Pair[] = [];
  let [message, rawPairs] = messageAndPairs.split('|');

  if (!messageAndPairs.includes('|') && !rawPairs) {
    rawPairs = message;
    message = '';
  }
  message = message.trim();
  rawPairs = rawPairs.trim();

  const matches = [...rawPairs.matchAll(pairTokenRegex)].flatMap((match) => {
    const equalsIndex = match[0].lastIndexOf('=');
    return equalsIndex === -1
      ? []
      : [{ 0: match[0].slice(0, equalsIndex + 1), index: match.index }];
  });

  matches.forEach((m, idx) => {
    const rawKey = m[0];
    const key = rawKey.slice(0, -1);
    const start = m.index || 0;
    const end = idx !== matches.length - 1 ? matches[idx + 1].index : undefined;
    const value = (
      end
        ? rawPairs.slice(start + rawKey.length, end)
        : rawPairs.slice(start + rawKey.length)
    ).trim();
    pairs.push({ key, value });
  });

  return [message, pairs];
}
