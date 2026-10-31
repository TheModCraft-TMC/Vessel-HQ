import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// The operator injects this key from a credential manager. No key or API
// credential is written to disk. Snapshots can contain sensitive tool data.
export class StateStore {
  constructor(directory, key, fingerprint) {
    if (!directory || !/^[a-f0-9]{64}$/i.test(key ?? '')) throw new Error('Persistent approvals require a state directory and 32-byte hex state key');
    this.directory = resolve(directory);
    this.key = Buffer.from(key, 'hex');
    this.fingerprint = fingerprint;
  }
  path(id) {
    if (!/^[a-f0-9]{48}$/.test(id)) throw new Error('Invalid continuation ID');
    return join(this.directory, id);
  }
  async init() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    if (((await stat(this.directory)).mode & 0o077) !== 0) throw new Error('State directory must be private (0700)');
  }
  async read(id) {
    const bytes = await readFile(this.path(id));
    if (bytes.length > 4 * 1024 * 1024) throw new Error('Invalid state');
    const decipher = createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const data = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
    if (data.expires < Date.now() || data.fingerprint !== this.fingerprint) throw new Error('Continuation expired or configuration changed');
    data.state.snapshot = Buffer.from(data.state.snapshot, 'base64');
    return data;
  }
  async write(id, data, exclusive = false) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(Buffer.from(id));
    const json = JSON.stringify({ ...data, state: { ...data.state, snapshot: Buffer.from(data.state.snapshot).toString('base64') } });
    const ciphertext = Buffer.concat([cipher.update(json), cipher.final()]);
    const bytes = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]);
    if (exclusive) await writeFile(this.path(id), bytes, { flag: 'wx', mode: 0o600 });
    else {
      const temporary = this.path(randomBytes(24).toString('hex'));
      await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
      await rename(temporary, this.path(id));
    }
  }
  async save(continuation) {
    await this.init();
    // Bound disk use and remove old, unreadable or expired state, never follow
    // arbitrary caller paths. This directory is exclusive to this adapter.
    const ids = (await readdir(this.directory)).filter((id) => /^[a-f0-9]{48}$/.test(id));
    for (const id of ids) {
      try {
        await this.read(id);
      } catch {
        await unlink(this.path(id));
      }
    }
    if ((await readdir(this.directory)).length >= 100) throw new Error('Continuation storage limit exceeded');
    const id = randomBytes(24).toString('hex');
    await this.write(id, { ...continuation, fingerprint: this.fingerprint, expires: Date.now() + 24 * 60 * 60 * 1000, approved: false }, true);
    return { continuationId: id, pending: { name: continuation.state.args[0], arguments: continuation.state.args[1] } };
  }
  async approve(id) {
    const data = await this.read(id);
    if (data.approved) throw new Error('Already approved');
    await this.write(id, { ...data, approved: true });
  }
  async take(id) {
    // An exclusive lease prevents concurrent or repeated resume. Read approval
    // first so a premature model resume does not consume the pending state.
    const data = await this.read(id);
    if (!data.approved) throw new Error('Operator approval required');
    const lease = `${this.path(id)}.consumed`;
    await rename(this.path(id), lease);
    await unlink(lease);
    return data;
  }
}

export const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
