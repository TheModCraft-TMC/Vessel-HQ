import {
  ArrowRightIcon,
  PlayIcon,
  PlusIcon,
  StopCircleIcon,
  Trash2Icon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { Authorized } from '@/react/hooks/useUser';
import { Stack, StackStatus } from '@/domains/stacks/models/types';
import { useDeleteStackMutation } from '@/domains/stacks/queries/common/useDeleteStackMutation';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { EditGitSettingsButton } from '@/domains/stacks/components/common/EditGitSettingsButton';
import { GitPullButton } from '@/domains/stacks/components/common/GitPullButton';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { Link } from '@/ui/components/links/Link';
import { confirm, confirmDelete } from '@/ui/components/dialog/confirm';
import { ModalType } from '@/ui/components/dialog/Modal/types';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { useUpdateStackMutation } from '@/domains/stacks/queries/useUpdateStack';

import { useStartStackMutation } from './useStartStackMutation';
import { useStopStackMutation } from './useStopStackMutation';

export function StackActions({
  stack,
  fileContent,
  isRegular,
  environmentId,
  isExternal,
  status,
}: {
  stack: Stack;
  fileContent?: string;
  isRegular?: boolean;
  environmentId: number;
  isExternal: boolean;
  status: Stack['Status'];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const startStackMutation = useStartStackMutation();
  const stopStackMutation = useStopStackMutation();
  const deleteStackMutation = useDeleteStackMutation();
  const detachFromGitMutation = useUpdateStackMutation();

  const isMutating =
    startStackMutation.isLoading ||
    stopStackMutation.isLoading ||
    deleteStackMutation.isLoading ||
    detachFromGitMutation.isLoading;

  const isDeploying = status === StackStatus.Deploying;

  const stackId = stack.Id;

  return (
    <div className="flex items-center gap-2">
      {!stack.ReadOnly && isRegular && (
        <Authorized authorizations="PortainerStackUpdate">
          {(status === StackStatus.Active || status === StackStatus.Error) && (
            <Button
              icon={StopCircleIcon}
              color="dangerlight"
              size="small"
              onClick={() => handleStop()}
              disabled={isMutating}
              data-cy="stack-stop-btn"
            >
              Stop this stack
            </Button>
          )}
          {status === StackStatus.Inactive && (
            <Button
              icon={PlayIcon}
              color="success"
              data-cy="stack-start-btn"
              size="small"
              disabled={isMutating}
              onClick={() => handleStart()}
            >
              Start this stack
            </Button>
          )}
        </Authorized>
      )}

      {!stack.ReadOnly && (
        <Authorized authorizations="PortainerStackDelete">
          <Button
            icon={Trash2Icon}
            color="dangerlight"
            size="small"
            onClick={() => handleDelete()}
            disabled={isMutating || isDeploying}
            data-cy="stack-delete-btn"
          >
            Delete this stack
          </Button>
        </Authorized>
      )}

      {!!(isRegular && fileContent) && (
        <Button
          as={Link}
          icon={PlusIcon}
          color="primary"
          size="small"
          data-cy="stack-create-template-btn"
          props={{
            to: '/:endpointId/docker/templates/custom/new',
            params: {
              fileContent,
              type: stack.Type,
            },
          }}
        >
          Create template from stack
        </Button>
      )}

      {!stack.ReadOnly && !!stack.GitConfig && !stack.FromAppTemplate && (
        <>
          <EditGitSettingsButton stack={stack} />

          <GitPullButton stack={stack} />

          {!!(isRegular && fileContent) && (
            <Authorized authorizations="PortainerStackUpdate">
              <LoadingButton
                icon={ArrowRightIcon}
                color="primary"
                onClick={() => handleDetachFromGit()}
                disabled={isMutating}
                data-cy="stack-detach-git-btn"
                isLoading={detachFromGitMutation.isLoading}
                loadingText="Detachment in progress..."
              >
                Detach from Git
              </LoadingButton>
            </Authorized>
          )}
        </>
      )}
    </div>
  );

  function handleStart() {
    startStackMutation.mutate(
      { id: stackId, environmentId },
      {
        onError(err) {
          notifyError('Failure', err as Error, 'Unable to start stack');
          router.refresh();
        },
        onSuccess() {
          notifySuccess('Success', `Stack ${stack.Name} started successfully`);
          router.refresh();
        },
      }
    );
  }

  async function handleStop() {
    const confirmed = await confirm({
      title: 'Are you sure?',
      modalType: ModalType.Warn,
      message: 'Are you sure you want to stop this stack?',
      confirmButton: buildConfirmButton('Stop', 'danger'),
    });

    if (!confirmed) {
      return;
    }

    stopStackMutation.mutate(
      { id: stackId, environmentId },
      {
        onError(err) {
          notifyError('Failure', err as Error, 'Unable to stop stack');
        },
        onSuccess() {
          notifySuccess('Success', `Stack ${stack.Name} stopped successfully`);
          router.refresh();
        },
      }
    );
  }

  async function handleDelete() {
    const confirmed = await confirmDelete(
      'Do you want to remove the stack? Associated services will be removed as well'
    );
    if (!confirmed) {
      return;
    }
    deleteStackMutation.mutate(
      {
        id: stack.Id,
        name: stack.Name,
        environmentId: stack.EndpointId,
        external: isExternal,
      },
      {
        onError(err) {
          notifyError(
            'Failure',
            err as Error,
            `Unable to remove stack ${stack.Name}`
          );
        },
        onSuccess() {
          notifySuccess('Stack successfully removed', stack.Name);
          router.push(buildHref('..', {}, pathname));
        },
      }
    );
  }

  async function handleDetachFromGit() {
    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: 'Are you sure?',
      message: 'Do you want to detach the stack from Git?',
      confirmButton: buildConfirmButton('Detach', 'danger'),
    });

    if (!confirmed) {
      return;
    }

    detachFromGitMutation.mutate(
      {
        environmentId,
        stackId: stack.Id,
        payload: {
          stackFileContent: fileContent!,
          env: stack.Env,
          prune: false,
        },
      },
      {
        onSuccess() {
          router.push(buildHref('..', {}, pathname));
        },
      }
    );
  }
}
