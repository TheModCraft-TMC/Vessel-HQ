import { useRouteParams } from '@console/console/routing/useRouteParams';

export function useIdParam(param = 'id', suppliedId?: number): number {
  const params = useRouteParams() as Record<string, string | string[]>;

  if (suppliedId) {
    return suppliedId;
  }

  const value = params[param];
  const stringId = Array.isArray(value) ? value[0] : value;
  const id = parseInt(stringId, 10);
  if (!id || Number.isNaN(id)) {
    throw new Error(`${param} url param is required`);
  }

  return id;
}
