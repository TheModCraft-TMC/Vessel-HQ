/** A bounded append-only buffer. Once full, the oldest values are discarded. */
export class BoundedBuffer<T> {
  private values: T[] = [];

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('A bounded buffer needs a positive integer capacity');
    }
  }

  push(value: T) {
    this.values.push(value);
    if (this.values.length > this.capacity) {
      this.values.splice(0, this.values.length - this.capacity);
    }
  }

  pushMany(values: readonly T[]) {
    values.forEach((value) => this.push(value));
  }

  snapshot() {
    return this.values.slice();
  }

  clear() {
    this.values = [];
  }

  get size() {
    return this.values.length;
  }
}

export class BoundedTextBuffer {
  private readonly buffer: BoundedBuffer<string>;

  constructor(private readonly maxLines: number) {
    this.buffer = new BoundedBuffer(maxLines);
  }

  append(value: string) {
    if (!value) return;
    const existing = this.buffer.snapshot();
    const combined =
      (existing.length ? existing.join('\n') + '\n' : '') + value;
    const next = combined.split('\n');
    this.buffer.clear();
    this.buffer.pushMany(next.slice(-this.maxLines));
  }

  toString() {
    return this.buffer.snapshot().join('\n');
  }
}
