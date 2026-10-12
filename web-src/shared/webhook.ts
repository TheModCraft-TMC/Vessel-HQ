import uuid from 'uuid';

import { baseHref } from './browser-path';

const API_ENDPOINT_EDGE_STACKS = 'api/edge_stacks';
const API_ENDPOINT_STACKS = 'api/stacks';
const API_ENDPOINT_WEBHOOKS = 'api/webhooks';

export function dockerWebhookUrl(token: string) {
  return `${getBaseUrl()}${API_ENDPOINT_WEBHOOKS}/${token}`;
}

export function baseStackWebhookUrl() {
  return `${getBaseUrl()}${API_ENDPOINT_STACKS}/webhooks`;
}

export function stackWebhookUrl(token: string) {
  return `${baseStackWebhookUrl()}/${token}`;
}

export function createWebhookId() {
  return uuid();
}

export function baseEdgeStackWebhookUrl() {
  return `${getBaseUrl()}${API_ENDPOINT_EDGE_STACKS}/webhooks`;
}

function getBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const protocol = window.location.protocol.toLowerCase().replace(':', '');

  if (protocol === 'file') {
    return baseHref();
  }

  const { hostname } = window.location;
  const port = parseInt(window.location.port, 10);
  const displayPort =
    (protocol === 'http' && port === 80) ||
    (protocol === 'https' && port === 443) ||
    Number.isNaN(port)
      ? ''
      : `:${port}`;
  return `${protocol}://${hostname}${displayPort}${baseHref()}`;
}
