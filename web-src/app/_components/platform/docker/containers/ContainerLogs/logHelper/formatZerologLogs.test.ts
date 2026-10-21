import { formatZerologLogs, ZerologRegex } from './formatZerologLogs';

describe('zerolog parser', () => {
  const format = formatZerologLogs;
  const regex = ZerologRegex;
  const prefix = '2022/02/01 04:30AM INF path/to/file.go:123 > ';

  it('parses callers, messages, and key/value pairs', () => {
    const result = format(`${prefix}hello world | key=value next=two words`);
    expect(result[0].line).toContain('to/file.go:123 > hello world');
    expect(result[0].line).toContain('key=value');
    expect(result[0].line).toContain('next=two words');
  });

  it('retains the last-equals delimiter behavior within a token', () => {
    const result = format(`${prefix}hello | token=a=b tail=end`);
    expect(result[0].line).toContain('token=a=b');
    expect(result[0].line).toContain('tail=end');
  });

  it('rejects a caller without a literal .go extension', () => {
    expect(regex.test(`${prefix.replace('file.go', 'fileXgo')}hello`)).toBe(
      false
    );
  });

  it('handles long non-key tokens and malformed callers without runaway backtracking', () => {
    const token = 'x'.repeat(100_000);
    expect(format(`${prefix}message | ${token}`)[0].line).toContain('message');
    expect(regex.test(`2022/02/01 04:30AM INF ${token}`)).toBe(false);
  });
});
