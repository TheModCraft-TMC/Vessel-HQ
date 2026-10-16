import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  approveExtension,
  disableExtension,
  getExtensions,
  registerExtension,
  removeExtension,
  uploadExtension,
} from '../services/extensions.service';
import type { ExtensionApproval } from '../models/types';

const queryKey = ['native-extensions'];

export function useExtensions() {
  return useQuery({
    queryKey,
    queryFn: getExtensions,
    // Approval is authority for loading native code, not ordinary warm view data.
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
    networkMode: 'always',
  });
}

export function useExtensionActions() {
  const client = useQueryClient();
  const options = { onSuccess: () => client.invalidateQueries(queryKey) };
  return {
    register: useMutation(registerExtension, options),
    upload: useMutation(
      ({ file, signal }: { file: File; signal: AbortSignal }) =>
        uploadExtension(file, signal),
      { onSettled: options.onSuccess }
    ),
    approve: useMutation(
      ({ id, approval }: { id: number; approval: ExtensionApproval }) =>
        approveExtension(id, approval),
      options
    ),
    disable: useMutation(disableExtension, options),
    remove: useMutation(removeExtension, options),
  };
}
