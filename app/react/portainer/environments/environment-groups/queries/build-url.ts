import { EnvironmentGroupId } from '@/features/environments';

export function buildUrl(id?: EnvironmentGroupId, action?: string) {
  let url = '/endpoint_groups';

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
