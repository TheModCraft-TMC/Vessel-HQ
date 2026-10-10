'use client';

import { useMemo, useState } from 'react';
import { Formik } from 'formik';
import { usePathname, useRouter } from 'next/navigation';
import uuidv4 from 'uuid/v4';
import { buildHref } from '@console/console/routing/buildHref';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import type { EnvironmentId } from '@/domains/environments';
import { getDefaultModel, type RelativePathModel } from '@/domains/gitops';
import {
  type CreateStackPayload,
  useCreateStack,
} from '@/domains/stacks/queries/common/useCreateStack/useCreateStack';
import {
  useIsSwarmManager,
  useSwarmId,
} from '@/domains/stacks/hooks/useDockerEnvironment';
import { CreateStackInnerForm } from '@/domains/stacks/views/CreateView/CreateStackForm/CreateStackInnerForm';
import type { FormValues } from '@/domains/stacks/views/CreateView/CreateStackForm/types';
import { useValidationSchema } from '@/domains/stacks/views/CreateView/CreateStackForm/useValidationSchema';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';

export default function Page() {
  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarmManager(environmentId);
  const swarmIdQuery = useSwarmId(environmentId);

  if (isSwarm && swarmIdQuery.isLoading) {
    return null;
  }

  const swarmId = isSwarm && swarmIdQuery.data ? swarmIdQuery.data : '';

  return (
    <>
      <PageHeader title="Create stack" breadcrumbs="Stack creation" reload />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateStackForm
                environmentId={environmentId}
                isSwarm={isSwarm}
                swarmId={swarmId}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}

function CreateStackForm({
  environmentId,
  isSwarm,
  swarmId,
}: {
  environmentId: EnvironmentId;
  isSwarm: boolean;
  swarmId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { yaml } = useRouteParams();
  const createStackMutation = useCreateStack();
  const { user } = useCurrentUser();
  const { isAdmin } = useIsEdgeAdmin();
  const [webhookId] = useState(() => uuidv4());
  const validationSchema = useValidationSchema(environmentId);
  const initialValues = useMemo<FormValues>(
    () => ({
      method: 'editor',
      name: '',
      editor: { fileContent: yaml || '' },
      upload: { file: null },
      git: {
        ...getDefaultModel(),
        SupportRelativePath: false,
        FilesystemPath: '',
      },
      template: {
        fileContent: '',
        selectedId: undefined,
        variables: [],
      },
      env: [],
      secretMappings: [],
      enableWebhook: false,
      registries: [],
      accessControl: defaultValues(isAdmin, user.Id),
    }),
    [isAdmin, user.Id, yaml]
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      validateOnMount
    >
      <CreateStackInnerForm
        isDeploying={createStackMutation.isLoading}
        isSwarm={isSwarm}
        isSaved={createStackMutation.isSuccess}
        webhookId={webhookId}
      />
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    const payload = buildCreateStackPayload({
      values,
      environmentId,
      stackType: isSwarm ? 'swarm' : 'standalone',
      swarmId,
      webhookId,
    });

    createStackMutation.mutate(payload, {
      onSuccess: (stack) => {
        notifySuccess('Success', 'Stack successfully created');
        router.push(
          buildHref(
            '/:endpointId/docker/stacks/:name',
            {
              name: stack.Name,
              id: stack.Id,
              type: stack.Type,
              regular: 'true',
            },
            pathname
          )
        );
      },
    });
  }
}

function buildCreateStackPayload({
  environmentId,
  stackType,
  swarmId,
  values,
  webhookId,
}: {
  values: FormValues;
  environmentId: EnvironmentId;
  stackType: 'swarm' | 'standalone';
  swarmId: string;
  webhookId: string;
}): CreateStackPayload {
  const basePayload = {
    name: values.name,
    environmentId,
    env: values.env,
    accessControl: values.accessControl,
    registries: values.registries,
  };

  switch (values.method) {
    case 'editor':
      return stackType === 'swarm'
        ? {
            type: 'swarm',
            method: 'string',
            payload: {
              ...basePayload,
              swarmId,
              fileContent: values.editor.fileContent,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          }
        : {
            type: 'standalone',
            method: 'string',
            payload: {
              ...basePayload,
              fileContent: values.editor.fileContent,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          };

    case 'upload':
      if (!values.upload.file) {
        throw new Error('File is required for upload method');
      }
      return stackType === 'swarm'
        ? {
            type: 'swarm',
            method: 'file',
            payload: {
              ...basePayload,
              swarmId,
              file: values.upload.file,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          }
        : {
            type: 'standalone',
            method: 'file',
            payload: {
              ...basePayload,
              file: values.upload.file,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          };

    case 'repository': {
      const relativePathSettings: RelativePathModel | undefined = values.git
        .SupportRelativePath
        ? {
            SupportRelativePath: true,
            FilesystemPath: values.git.FilesystemPath,
            SupportPerDeviceConfigs: false,
            PerDeviceConfigsPath: '',
            PerDeviceConfigsMatchType: '',
            PerDeviceConfigsGroupMatchType: '',
          }
        : undefined;
      const payload = {
        ...basePayload,
        git: values.git,
        secretMappings: values.secretMappings,
        webhook: webhookId,
        relativePathSettings,
      };

      return stackType === 'swarm'
        ? {
            type: 'swarm',
            method: 'git',
            payload: { ...payload, swarmId },
          }
        : { type: 'standalone', method: 'git', payload };
    }

    case 'template':
      return stackType === 'swarm'
        ? {
            type: 'swarm',
            method: 'string',
            payload: {
              ...basePayload,
              swarmId,
              fileContent: values.template.fileContent,
              webhook: values.enableWebhook ? webhookId : undefined,
              fromAppTemplate: true,
            },
          }
        : {
            type: 'standalone',
            method: 'string',
            payload: {
              ...basePayload,
              fileContent: values.template.fileContent,
              webhook: values.enableWebhook ? webhookId : undefined,
              fromAppTemplate: true,
            },
          };

    default:
      throw new Error('Invalid method');
  }
}
