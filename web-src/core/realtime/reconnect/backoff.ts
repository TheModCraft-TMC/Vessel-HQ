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
  // Security review (S2245): jitter only spreads reconnect load; it is not an ID, secret, or authorization decision.
  return delay + Math.floor(Math.random() * Math.min(jitterMs, delay)); // NOSONAR
}
