import { BoundedTextBuffer } from './bounded-buffer';

describe('BoundedTextBuffer', () => {
  it('preserves partial lines and newline boundaries across chunks', () => {
    const buffer = new BoundedTextBuffer(10);
    buffer.append('hel');
    buffer.append('lo\n');
    buffer.append('world');
    expect(buffer.toString()).toBe('hello\nworld');
  });

  it('discards only the oldest lines when retention is exceeded', () => {
    const buffer = new BoundedTextBuffer(3);
    buffer.append('one\ntwo\nthree\nfour');
    buffer.append(' continued\nfive');
    expect(buffer.toString()).toBe('three\nfour continued\nfive');
  });

  it('retains a trailing newline and ignores empty chunks', () => {
    const buffer = new BoundedTextBuffer(3);
    buffer.append('one\n');
    buffer.append('');
    buffer.append('two\n');
    expect(buffer.toString()).toBe('one\ntwo\n');
  });
});
