export type ReconnectPolicy = {
  minDelayMs?: number;
  maxDelayMs?: number;
  jitterMs?: number;
};

export function exponentialBackoff(
  attempt: number,
  {
    minDelayMs = 1_000,
    maxDelayMs = 30_000,
    jitterMs = 1_000,
  }: ReconnectPolicy = {}
) {
  const delay = Math.min(maxDelayMs, minDelayMs * 2 ** Math.max(0, attempt));
  return delay + Math.floor(Math.random() * Math.min(jitterMs, delay));
}
