export const CACHE_DURATION = 5 * 60 * 1000;

interface Headers {
  agentTargetQueue: string[];
  agentManagerOperation: boolean;
  registryAuthentication?: string;
  agentTargetLastValue: string;
}

const headers: Headers = {
  agentTargetQueue: [],
  agentManagerOperation: false,
  agentTargetLastValue: '',
};

export function registryAuthenticationHeader() {
  return headers.registryAuthentication;
}

export function setRegistryAuthenticationHeader(headerValue: string) {
  headers.registryAuthentication = headerValue;
}

// Interceptors decorate async requests, so agent targets use FIFO ordering.
// The last value is retained for consecutive requests against the same node.
export function portainerAgentTargetHeader() {
  if (headers.agentTargetQueue.length === 0) {
    return headers.agentTargetLastValue;
  }

  if (headers.agentTargetQueue.length === 1) {
    const [lastValue] = headers.agentTargetQueue;
    headers.agentTargetLastValue = lastValue;
  }

  return headers.agentTargetQueue.shift() || '';
}

export function setPortainerAgentTargetHeader(headerValue: string) {
  if (headerValue) {
    headers.agentTargetQueue.push(headerValue);
  }
}

export function setPortainerAgentManagerOperation(set: boolean) {
  headers.agentManagerOperation = set;
}

export function portainerAgentManagerOperation() {
  return headers.agentManagerOperation;
}

export function resetAgentHeaders() {
  headers.agentTargetQueue = [];
  headers.agentTargetLastValue = '';
  headers.agentManagerOperation = false;
  delete headers.registryAuthentication;
}
