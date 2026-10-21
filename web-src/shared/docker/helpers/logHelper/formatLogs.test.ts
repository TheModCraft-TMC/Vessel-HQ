import { formatJSONLine } from './formatJSONLogs';
import { formatLogs } from './formatLogs';
import { formatZerologLogs } from './formatZerologLogs';

const timestamps = [
  '2026-02-01T04:30:00.123456789Z',
  '2026-02-01T04:30:00.123456000Z',
  '2026-02-01T04:30:00.123456Z',
  '2026-02-01T04:30:00.123Z',
  '2026-02-01T04:30:00.1Z',
  '2026-02-01T04:30:00Z',
  '2026-02-01T04:30:00.12+02:30',
];
const json = '{"message":"hello world"}';
const zerolog =
  '2022/02/01 04:30AM INF path/to/file.go:123 > hello world | key=value';

const formats = [
  { name: 'JSON', payload: json, format: formatJSONLine },
  {
    name: 'JSON with fields and stack trace',
    payload: JSON.stringify({
      time: '2026/02/01 04:30AM',
      level: 'info',
      caller: 'path/to/file.go:123',
      message: 'hello world',
      key: 'value',
      stack_trace: [{ func: 'main', source: 'main.go', line: '12' }],
    }),
    format: formatJSONLine,
  },
  { name: 'zerolog', payload: zerolog, format: formatZerologLogs },
];

describe.each(formats)(
  '$name Docker timestamp handling',
  ({ payload, format }) => {
    it.each(timestamps)(
      'detects and formats %s without losing content',
      (timestamp) => {
        const prefix = `${timestamp} `;
        const raw = `${prefix}${payload}`;
        const baseline = format(payload);
        const expected = [
          {
            ...baseline[0],
            line: `${prefix}${baseline[0].line}`,
            spans: [{ text: prefix }, ...baseline[0].spans],
          },
          ...baseline.slice(1),
        ];

        const direct = format(raw, true);
        expect(direct).toEqual(expected);
        expect(formatLogs(raw, { withTimestamps: true })).toEqual(expected);
        expect(direct[0].line.split(timestamp)).toHaveLength(2);
        expect(direct[0].spans.map(({ text }) => text).join('')).toBe(
          `${prefix}${baseline[0].spans.map(({ text }) => text).join('')}`
        );
        expect(direct[0].line).toContain('hello world');
      }
    );

    it('still detects unprefixed logs when timestamps are disabled', () => {
      expect(formatLogs(payload)).toEqual(format(payload));
      expect(formatLogs(payload, { withTimestamps: false })).toEqual(
        format(payload)
      );
      expect(format(payload, false)).toEqual(format(payload));
    });

    it.each([
      '',
      'not-a-timestamp ',
      '2026-13-01T04:30:00Z ',
      '2026-02-01T25:30:00Z ',
      '2026-02-01T04:30:00.Z ',
      '2026-02-01T04:30:00.1234567890Z ',
      '2026-02-01T04:30:00 ',
      '2026-02-01T04:30:00Z',
      '2026-02-01T04:30:00Z\t',
      '2026-02-01T04:30:00+99:00 ',
    ])('keeps missing or malformed timestamp prefix %j raw', (prefix) => {
      const raw = `${prefix}${payload}`;
      expect(format(raw, true)).toEqual([
        { line: raw, spans: [{ text: raw }] },
      ]);
      const result = formatLogs(raw, { withTimestamps: true });
      expect(result.map(({ line }) => line)).toEqual([raw]);
      expect(result[0].spans.map(({ text }) => text).join('')).toBe(raw);
    });
  }
);

describe('structured copy and download text', () => {
  it.each([false, true])(
    'matches visible JSON spans with timestamps=%s',
    (withTimestamps) => {
      const prefix = withTimestamps ? '2026-02-01T04:30:00.1Z ' : '';
      const payload = JSON.stringify({
        time: 1769920200,
        level: 'info',
        caller: 'service/worker.go:42',
        message: 'Completed once',
        count: 2,
        healthy: true,
      });
      const [result] = formatJSONLine(prefix + payload, withTimestamps);
      expect(result.line).toBe(result.spans.map(({ text }) => text).join(''));
      expect(result.line.match(/Completed once/g)).toHaveLength(1);
      expect(result.line.startsWith(prefix)).toBe(true);
    }
  );

  it.each([false, true])(
    'matches visible zerolog spans with timestamps=%s',
    (withTimestamps) => {
      const prefix = withTimestamps ? '2026-02-01T04:30:00.1Z ' : '';
      const payload =
        '2026/02/01 04:30AM INF service/worker.go:42 > Completed once | count=2 healthy=true';
      const [result] = formatZerologLogs(prefix + payload, withTimestamps);
      expect(result.line).toBe(result.spans.map(({ text }) => text).join(''));
      expect(result.line.match(/Completed once/g)).toHaveLength(1);
      expect(result.line.startsWith(prefix)).toBe(true);
    }
  );
});

describe('timestamp raw fallback', () => {
  it.each([
    'ordinary unprefixed line with spaces',
    '2026-02-01T04:30:00.1Z ordinary line',
    '2026-02-01T04:30:00Z {invalid JSON}',
    '2026-02-01T04:30:00.123456789Z 2022/02/01 04:30AM INF invalid caller',
    `2026-02-01T04:30:00Z  ${json}`,
  ])('preserves %j exactly', (raw) => {
    const result = formatLogs(raw, { withTimestamps: true });
    expect(result.map(({ line }) => line)).toEqual([raw]);
    expect(result[0].spans.map(({ text }) => text).join('')).toBe(raw);
  });

  it('detects each timestamp length independently in a multiline stream', () => {
    const rawLines = timestamps.map((timestamp) => `${timestamp} ${json}`);
    const result = formatLogs(rawLines.join('\n'), { withTimestamps: true });
    expect(result.map(({ line }) => line)).toEqual(
      timestamps.map((timestamp) => `${timestamp} hello world `)
    );
    result.forEach(({ line, spans }) => {
      expect(spans.map(({ text }) => text).join('')).toBe(line);
    });
  });
});
