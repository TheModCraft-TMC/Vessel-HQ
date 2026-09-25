export class EdgeAgentTransportError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'EdgeAgentTransportError';
    this.cause = cause;
  }
}
