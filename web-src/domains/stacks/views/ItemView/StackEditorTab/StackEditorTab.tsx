import { Formik } from 'formik';
import { useRouter } from 'next/navigation';
import _ from 'lodash';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Stack, StackType } from '@/domains/stacks/models/types';
import { useDockerComposeSchema } from '@/core/hooks/useDockerComposeSchema/useDockerComposeSchema';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { confirmStackUpdate } from '@/domains/stacks/components/common/confirm-stack-update';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { useUpdateStackMutation } from '@/domains/stacks/queries/useUpdateStack';
import { useStackFile } from '@/domains/stacks/queries/common/useStackFile';
import { LoadingButton } from '@/ui/components/buttons';
import { confirmWebEditorDiscard } from '@/ui/components/dialog/confirm';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { StackEditorFormValues } from './StackEditorTab.types';
import { getValidationSchema } from './StackEditorTab.validation';
import { StackEditorTabInner } from './StackEditorTabInner';
import styles from './StackEditorTab.module.css';

interface StackEditorTabProps {
  isOrphaned: boolean;
  containerNames?: string[];
  originalContainerNames?: string[];
  stack: Stack;
  originalFileContent: string;
  originalFileRevision?: string;

  onSubmitSuccess?(): void;
}

export function StackEditorTab({
  isOrphaned,

  containerNames = [],
  originalContainerNames = [],
  originalFileContent,
  originalFileRevision,
  onSubmitSuccess = () => {},
  stack,
}: StackEditorTabProps) {
  const versions = _.compact([
    stack.StackFileVersion,
    stack.PreviousDeploymentInfo?.FileVersion,
  ]);
  const router = useRouter();
  const mutation = useUpdateStackMutation();
  const envQuery = useCurrentEnvironment();
  const schemaQuery = useDockerComposeSchema();
  const [webhookId] = useState(() => stack.Webhook || uuidv4());
  const [project, setProject] = useState({
    content: originalFileContent,
    revision: originalFileRevision,
  });
  const fileQuery = useStackFile(
    stack.Id,
    {
      version: stack.StackFileVersion,
      commitHash: stack.GitConfig?.ConfigHash,
    },
    { enabled: false }
  );

  if (!envQuery.data || !schemaQuery.data) {
    return null;
  }

  const envType = envQuery.data?.Type;
  const composeSyntaxMaxVersion = Number.parseFloat(
    envQuery.data?.ComposeSyntaxMaxVersion
  );

  const initialValues: StackEditorFormValues = {
    environmentVariables: stack.Env || [],
    prune: !!(stack.Option && stack.Option.Prune),
    stackFileContent: project.content,
    enabledWebhook: !!stack.Webhook,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={getValidationSchema(
        containerNames,
        originalContainerNames
      )}
      onSubmit={async (values) => {
        const response = await confirmStackUpdate(
          'Do you want to force an update of the stack?',
          stack.Type === StackType.DockerSwarm
        );

        if (!response) {
          return;
        }

        mutation.mutate(
          {
            stackId: stack.Id,
            environmentId: envQuery.data.Id,
            expectedRevision: project.revision,
            payload: {
              stackFileContent: values.stackFileContent,
              env: values.environmentVariables,
              prune: values.prune,
              webhook: values.enabledWebhook ? webhookId : undefined,
              repullImageAndRedeploy: response.repullImageAndRedeploy,
              rollbackTo: values.rollbackTo,
            },
          },
          {
            async onSuccess() {
              // App Router refresh preserves this editor's state. Advance the
              // revision after our own write so the next save does not conflict
              // with it, without reinitializing any edits made during deployment.
              const result = await fileQuery.refetch();
              const savedFile = result.data;
              if (
                !result.error &&
                savedFile?.StackFileContent === values.stackFileContent
              ) {
                setProject((current) => ({
                  ...current,
                  revision: savedFile.Revision,
                }));
              }
              notifySuccess('Success', 'Stack successfully deployed');
              router.refresh();
              onSubmitSuccess();
            },
            onError(err) {
              notifyError('Failure', err as Error, 'Unable to create stack');
            },
          }
        );
      }}
      validateOnMount
      enableReinitialize
    >
      <>
        {!project.revision && (
          <TextTip color="orange">
            External-file conflict checks are unavailable for this project.
            Reload and review its files before deploying.
          </TextTip>
        )}
        <LoadingButton
          className={styles.reloadButton}
          type="button"
          size="small"
          color="default"
          isLoading={fileQuery.isFetching}
          loadingText="Reloading…"
          onClick={() => void reloadProject()}
          data-cy="stack-reload-project"
        >
          Reload project from disk (discard edits)
        </LoadingButton>
        <StackEditorTabInner
          stackId={stack.Id}
          stackType={stack.Type}
          composeSyntaxMaxVersion={composeSyntaxMaxVersion}
          isOrphaned={isOrphaned}
          envType={envType}
          schema={schemaQuery.data}
          versions={versions}
          isSubmitting={mutation.isLoading}
          isSaved={mutation.isSuccess}
          webhookId={webhookId}
          isReadOnly={!!stack.ReadOnly}
        />
      </>
    </Formik>
  );

  async function reloadProject() {
    if (!(await confirmWebEditorDiscard())) return;
    const result = await fileQuery.refetch();
    if (result.data && !result.error) {
      setProject({
        content: result.data.StackFileContent,
        revision: result.data.Revision,
      });
      mutation.reset();
    }
  }
}
