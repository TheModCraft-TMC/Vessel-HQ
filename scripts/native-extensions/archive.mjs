// Deterministic ZIP STORE writer for already-validated source packages. No
// executable hooks or third-party archive library. Backend payloads are inert bytes.
import { deflateRawSync } from 'node:zlib';

export function sourceArchive(entries) {
  const locals = [];
  const central = [];
  let position = 0;
  for (const { name, bytes, directory, executable } of entries) {
    const filename = Buffer.from(directory ? `${name}/` : name, 'ascii');
    const compressed = directory ? bytes : deflateRawSync(bytes);
    const useCompression = compressed.length < bytes.length && bytes.length <= compressed.length * 100;
    const payload = useCompression ? compressed : bytes;
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(useCompression ? 8 : 0, 8);
    local.writeUInt16LE(33, 12); // January 1, 1980; no machine timestamps.
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(filename.length, 26);
    const descriptor = Buffer.alloc(46);
    descriptor.writeUInt32LE(0x02014b50, 0);
    descriptor.writeUInt16LE(0x0314, 4); // UNIX creator + ZIP 2.0.
    descriptor.writeUInt16LE(20, 6);
    descriptor.writeUInt16LE(useCompression ? 8 : 0, 10);
    descriptor.writeUInt16LE(33, 14);
    descriptor.writeUInt32LE(crc, 16);
    descriptor.writeUInt32LE(payload.length, 20);
    descriptor.writeUInt32LE(bytes.length, 24);
    descriptor.writeUInt16LE(filename.length, 28);
    descriptor.writeUInt32LE((((directory ? 0o40755 : executable ? 0o100755 : 0o100644) << 16) | (directory ? 0x10 : 0)) >>> 0, 38);
    descriptor.writeUInt32LE(position, 42);
    locals.push(local, filename, payload);
    central.push(descriptor, filename);
    position += local.length + filename.length + payload.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(position, 16);
  return Buffer.concat([...locals, directory, end]);
}
