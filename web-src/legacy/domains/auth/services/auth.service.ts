import { userAdminCheck } from '@api/sdk.gen';

export async function administratorExists() {
  const result = await userAdminCheck({ throwOnError: false });

  if ('error' in result) {
    if ('response' in result && result.response?.status === 404) {
      return false;
    }

    throw result;
  }

  return true;
}
