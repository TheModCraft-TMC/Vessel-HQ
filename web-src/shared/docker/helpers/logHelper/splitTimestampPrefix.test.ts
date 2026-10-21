import { splitTimestampPrefix } from './splitTimestampPrefix';

describe('splitTimestampPrefix', () => {
  it.each([
    '2026-02-01T04:30:00.123456789Z ',
    '2026-02-01T04:30:00.12Z ',
    '2026-02-01T04:30:00Z ',
    '2026-02-01T04:30:00.123456789-02:30 ',
  ])(
    'splits %j without modifying timestamp or payload whitespace',
    (prefix) => {
      const text = '  message with spaces  ';
      expect(splitTimestampPrefix(`${prefix}${text}`)).toEqual({
        prefix,
        text,
      });
      expect(splitTimestampPrefix(prefix)).toEqual({ prefix, text: '' });
    }
  );

  it.each([
    'plain text',
    'before 2026-02-01T04:30:00Z message',
    '2026-02-01T04:30:00.Z message',
    '2026-02-01T04:30:00.1234567890Z message',
    '2026-02-01T04:30:00Z',
    '2026-02-01T04:30:00Z\nmessage',
    `2026-02-01T04:30:00.${'1'.repeat(100_000)}Z message`,
  ])('does not split missing/malformed prefixes (case %#)', (text) => {
    expect(splitTimestampPrefix(text)).toBeUndefined();
  });
});
