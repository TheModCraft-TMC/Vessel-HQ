import { Pod } from 'kubernetes-types/core/v1';

import type { Stack } from '@/domains/stacks';
import { EnvironmentId } from '@/domains/environments';
import { isGitConfigDiverged } from '@/domains/gitops';
import { AddButton } from '@/ui/components/buttons';
import { useAppStackFile } from '@/domains/applications/applications/queries/useAppStackFile';
import { Application } from '@/domains/applications/applications/types';
import { applicationIsKind } from '@/domains/applications/applications/utils';

import { EditButtons } from './EditButtons';
import { RedeployApplicationButton } from './RedeployApplicationButton';
import { RollbackApplicationButton } from './RollbackApplicationButton';

export function ButtonsLine({
  stack,
  environmentId,
  externalApp,
  appStackId,
  appStackKind,
  app,
  name,
  namespace,
}: {
  stack?: Stack;
  externalApp: boolean;
  environmentId: EnvironmentId;
  appStackId?: number;
  appStackKind?: string;
  namespace: string;
  app?: Application;
  name: string;
}) {
  const appStackFileQuery = useAppStackFile(
    {
      id: stack?.Id ?? appStackId,
      kind: appStackKind,
    },
    {
      enabled:
        !!stack &&
        (!stack.GitConfig ||
          !isGitConfigDiverged(stack.GitConfig, stack.CurrentDeploymentInfo)),
    }
  );
  const appStackFileContent = appStackFileQuery.data;

  return (
    <div className="flex flex-wrap gap-2">
      <EditButtons
        isEdge={appStackKind === 'edge'}
        stackId={stack?.Id ?? appStackId}
        externalApp={externalApp}
        stack={stack}
      />
      {!applicationIsKind<Pod>('Pod', app) && (
        <RedeployApplicationButton
          environmentId={environmentId}
          namespace={namespace}
          appName={name}
          app={app}
        />
      )}
      {!externalApp && (
        <RollbackApplicationButton
          environmentId={environmentId}
          namespace={namespace}
          appName={name}
          app={app}
        />
      )}
      {appStackFileContent && (
        <AddButton
          to="/:endpointId/kubernetes/templates/custom/new"
          data-cy="k8sAppDetail-createCustomTemplateButton"
          params={{
            fileContent: appStackFileContent,
          }}
        >
          Create template from application
        </AddButton>
      )}
    </div>
  );
}
