'use client';
import type { StackTrafficOverview } from '@/core/native-extensions/sdk';

export function counterRate(
  previous: StackTrafficOverview | undefined,
  current: StackTrafficOverview,
  id: string,
  direction: 'receivedBytes' | 'sentBytes'
): string {
  const before = previous?.traffic.counters.find(
    (item) => item.workloadId === id
  );
  const after = current.traffic.counters.find((item) => item.workloadId === id);
  if (
    !before?.available ||
    !after?.available ||
    !/^\d+$/.test(before[direction]) ||
    !/^\d+$/.test(after[direction])
  )
    return 'Waiting for two samples';
  const elapsed =
    (Date.parse(current.traffic.collectedAt) -
      Date.parse(previous!.traffic.collectedAt)) /
    1000;
  const delta = BigInt(after[direction]) - BigInt(before[direction]);
  if (elapsed <= 0 || delta < 0n || delta > BigInt(Number.MAX_SAFE_INTEGER))
    return 'Counter reset or invalid interval';
  return `${(Number(delta) / elapsed / 1024).toFixed(2)} KiB/s`;
}
