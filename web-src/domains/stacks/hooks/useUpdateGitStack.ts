import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Stack } from '@/domains/stacks/models/types';
import { updateGitStack, updateGitStackSettings } from '@/domains/gitops';
import { transformAutoUpdateViewModel } from '@/domains/gitops';
import { withError } from '@/core/query';

import { queryKeys } from '../queries/common/query-keys';
import { FormValues } from '../components/common/EditGitSettings/types';

interface MutationArgs {
  values: FormValues;
  repullImageAndRedeploy?: boolean;
  webhookId: string;
}

export function useUpdateGitStack(stack: Stack) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      values,
      repullImageAndRedeploy,
      webhookId,
    }: MutationArgs) => {
      const autoUpdate = transformAutoUpdateViewModel(
        values.git.AutoUpdate,
        webhookId
      );

      await updateGitStackSettings(stack.Id, stack.EndpointId, {
        ConfigFilePath: values.git.ComposeFilePathInRepository,
        RepositoryReferenceName: values.git.RepositoryReferenceName,
        AutoUpdate: autoUpdate,
        AdditionalFiles: values.git.AdditionalFiles,
        env: values.env,
        SecretMappings: values.secretMappings.map((mapping) => ({
          ...mapping,
          name: mapping.key,
        })),
        prune: values.prune,
        SourceID: values.git.SourceId,
        SupportRelativePath: values.git.SupportRelativePath,
        FilesystemPath: values.git.FilesystemPath,
      });

      if (repullImageAndRedeploy === undefined) {
        return { redeployAttempted: false, redeployFailed: false };
      }

      try {
        await updateGitStack(stack.Id, stack.EndpointId, {
          Env: values.env,
          Prune: values.prune,
          StackName: values.kube.name.trim() || undefined,
          RepullImageAndRedeploy: repullImageAndRedeploy,
        });
        return { redeployAttempted: true, redeployFailed: false };
      } catch (error) {
        return {
          redeployAttempted: true,
          redeployFailed: true,
          redeployError: error,
        };
      }
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: queryKeys.stackFile(stack.Id, {
          commitHash: stack?.GitConfig?.ConfigHash,
        }),
      });
      return queryClient.invalidateQueries({
        queryKey: queryKeys.stack(stack.Id),
      });
    },
    ...withError('Unable to save stack settings'),
  });
}
