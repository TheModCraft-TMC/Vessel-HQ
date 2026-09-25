import { notifyError } from '@/ui/components/toast/notifications';
import { isAxiosError } from '@/react/portainer/services/axios/utils/isAxiosError';
import { parseAxiosError } from '@/react/portainer/services/axios/utils/parseAxiosError';

export function withError(fallbackMessage?: string, title = 'Failure') {
  return { meta: { error: { message: fallbackMessage, title } } };
}

export function handleQueryError(error: unknown, errorMeta?: unknown) {
  const meta = extractErrorMeta(errorMeta);
  if (!meta) return;

  const parsedError = isAxiosError(error)
    ? parseAxiosError(error, meta.message)
    : error;
  notifyError(meta.title || 'Failure', parsedError, meta.message);
}

function extractErrorMeta(errorMeta?: unknown) {
  if (!errorMeta || typeof errorMeta !== 'object') return undefined;

  const title =
    'title' in errorMeta && typeof errorMeta.title === 'string'
      ? errorMeta.title
      : '';
  const message =
    'message' in errorMeta && typeof errorMeta.message === 'string'
      ? errorMeta.message
      : '';

  return { title, message };
}
