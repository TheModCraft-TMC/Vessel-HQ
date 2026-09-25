import { useState } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from '@uirouter/react';
import { array, number, object } from 'yup';

import { AutoUpdateFieldset } from '@/domains/gitops';
import { GitSourceSelector } from '@/domains/gitops';
import {
  parseAutoUpdateResponse,
  transformAutoUpdateViewModel,
} from '@/domains/gitops';
import { RefField } from '@/domains/gitops';
import { AutoUpdateModel, RelativePathModel } from '@/domains/gitops';
import {
  baseEdgeStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { DeploymentType, EdgeStack } from '@/domains/edge/models/edge-stack';
import { EdgeGroupsSelector } from '@/domains/edge/views/edge-stacks/components/EdgeGroupsSelector';
import { EdgeStackDeploymentTypeSelector } from '@/domains/edge/views/edge-stacks/components/EdgeStackDeploymentTypeSelector';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { EnvironmentType } from '@/domains/environments';
import { Registry } from '@/domains/registries';
import { useRegistries } from '@/domains/registries';
import { RelativePathFieldset } from '@/domains/gitops';
import { parseRelativePathResponse } from '@/domains/gitops';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { GitReferenceCard } from '@/domains/gitops';
import { LoadingButton } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormError } from '@/ui/components/forms/FormError';
import { EnvironmentVariablesPanel } from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { EnvVar } from '@/ui/components/forms/EnvironmentVariablesFieldset/types';
import { Link } from '@/ui/components/links/Link';

import { useEdgeGroupHasType } from '../useEdgeGroupHasType';
import { PrivateRegistryFieldset } from '../../../components/PrivateRegistryFieldset';

import {
  UpdateEdgeStackGitPayload,
  useUpdateEdgeStackGitMutation,
} from './useUpdateEdgeStackGitMutation';

interface FormValues {
  groupIds: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  autoUpdate: AutoUpdateModel;
  refName: string;
  envVars: EnvVar[];
  privateRegistryId?: Registry['Id'];
  relativePath: RelativePathModel;
}

export function GitForm({ stack }: { stack: EdgeStack }) {
  const router = useRouter();
  const updateStackMutation = useUpdateEdgeStackGitMutation();

  const [webhookId] = useState(
    () => stack.AutoUpdate?.Webhook || createWebhookId()
  );

  if (!stack.GitConfig) {
    return null;
  }

  const initialValues: FormValues = {
    groupIds: stack.EdgeGroups,
    deploymentType: stack.DeploymentType,
    autoUpdate: parseAutoUpdateResponse(stack.AutoUpdate),
    refName: stack.GitConfig.ReferenceName,
    relativePath: parseRelativePathResponse(stack),
    envVars: stack.EnvVars || [],
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={formValidation()}
    >
      {({ values, isValid }) => {
        return (
          <InnerForm
            webhookId={webhookId}
            onUpdateSettingsClick={handleUpdateSettings}
            isLoading={updateStackMutation.isLoading}
            isUpdateVersion={!!updateStackMutation.variables?.updateVersion}
            stack={stack}
          />
        );

        async function handleUpdateSettings() {
          if (!isValid) {
            return;
          }

          updateStackMutation.mutate(getPayload(values, false), {
            onSuccess() {
              notifySuccess('Success', 'Stack updated successfully');
              router.stateService.reload();
            },
          });
        }
      }}
    </Formik>
  );

  async function handleSubmit(values: FormValues) {
    updateStackMutation.mutate(getPayload(values, true), {
      onSuccess() {
        notifySuccess('Success', 'Stack updated successfully');
        router.stateService.reload();
      },
    });
  }

  function getPayload(
    { autoUpdate, privateRegistryId, ...values }: FormValues,
    updateVersion: boolean
  ): UpdateEdgeStackGitPayload {
    return {
      updateVersion,
      id: stack.Id,
      autoUpdate: transformAutoUpdateViewModel(autoUpdate, webhookId),
      registries:
        typeof privateRegistryId !== 'undefined'
          ? [privateRegistryId]
          : undefined,
      ...values,
    };
  }
}

function InnerForm({
  isLoading,
  isUpdateVersion,
  onUpdateSettingsClick,
  webhookId,
  stack,
}: {
  isLoading: boolean;
  isUpdateVersion: boolean;
  onUpdateSettingsClick(): void;
  webhookId: string;
  stack: EdgeStack;
}) {
  const registriesQuery = useRegistries();
  const { values, setFieldValue, isValid, handleSubmit, errors, dirty } =
    useFormikContext<FormValues>();

  const { hasType } = useEdgeGroupHasType(values.groupIds);

  const hasKubeEndpoint = hasType(EnvironmentType.EdgeAgentOnKubernetes);
  const hasDockerEndpoint = hasType(EnvironmentType.EdgeAgentOnDocker);

  if (!stack.GitConfig || !stack.GitSourceId) {
    return null;
  }

  return (
    <Form className="form-horizontal" onSubmit={handleSubmit}>
      <EdgeGroupsSelector
        value={values.groupIds}
        onChange={(value) => setFieldValue('groupIds', value)}
        error={errors.groupIds}
      />

      {hasKubeEndpoint && hasDockerEndpoint && (
        <TextTip>
          There are no available deployment types when there is more than one
          type of environment in your edge group selection (e.g. Kubernetes and
          Docker environments). Please select edge groups that have environments
          of the same type.
        </TextTip>
      )}

      {values.deploymentType === DeploymentType.Compose && hasKubeEndpoint && (
        <FormError>
          Edge groups with kubernetes environments no longer support compose
          deployment types in Portainer. Please select edge groups that only
          have docker environments when using compose deployment types.
        </FormError>
      )}
      <EdgeStackDeploymentTypeSelector
        value={values.deploymentType}
        hasDockerEndpoint={hasType(EnvironmentType.EdgeAgentOnDocker)}
        hasKubeEndpoint={hasType(EnvironmentType.EdgeAgentOnKubernetes)}
        onChange={(value) => {
          setFieldValue('deploymentType', value);
        }}
      />

      <GitReferenceCard
        stackType="edge"
        autoUpdate={stack.AutoUpdate}
        gitConfig={stack.GitConfig}
        sourceId={stack.GitSourceId}
      />

      <FormSection title="Update from git repository">
        <AutoUpdateFieldset
          webhookId={webhookId}
          value={values.autoUpdate}
          onChange={(value) =>
            setFieldValue('autoUpdate', {
              ...values.autoUpdate,
              ...value,
            })
          }
          baseWebhookUrl={baseEdgeStackWebhookUrl()}
        />
      </FormSection>

      <FormSection title="Advanced configuration" isFoldable>
        <RefField
          value={values.refName}
          onChange={(value) => setFieldValue('refName', value)}
          sourceId={stack.GitSourceId}
          error={errors.refName}
        />

        <GitSourceSelector value={stack.GitSourceId} readOnly />
        <TextTip>
          Credentials are managed by the source.{' '}
          <Link
            to="portainer.gitops.sources.item"
            params={{ sourceId: stack.GitSourceId }}
            data-cy="source-item-link"
          >
            Edit source
          </Link>
        </TextTip>

        {isBE && (
          <RelativePathFieldset
            values={values.relativePath}
            isEditing
            onChange={() => {}}
          />
        )}

        <EnvironmentVariablesPanel
          onChange={(value) => setFieldValue('envVars', value)}
          values={values.envVars}
          errors={errors.envVars}
        />
      </FormSection>

      <PrivateRegistryFieldset
        value={values.privateRegistryId}
        onChange={(value) => setFieldValue('privateRegistryId', value)}
        registries={registriesQuery.data ?? []}
        formInvalid={!isValid}
        method="repository"
        errorMessage={errors.privateRegistryId}
      />

      <FormSection title="Actions">
        <div className="flex items-center gap-2">
          <LoadingButton
            disabled={dirty || !isValid || isLoading}
            data-cy="pull-and-update-stack-button"
            isLoading={isUpdateVersion && isLoading}
            loadingText="updating stack..."
          >
            Pull and update stack
          </LoadingButton>

          <LoadingButton
            type="button"
            disabled={!dirty || !isValid || isLoading}
            isLoading={!isUpdateVersion && isLoading}
            loadingText="updating settings..."
            onClick={onUpdateSettingsClick}
            data-cy="edge-stack-update-settings-button"
          >
            Update settings
          </LoadingButton>
        </div>
      </FormSection>
    </Form>
  );
}

function formValidation() {
  return object({
    groupIds: array()
      .of(number().required())
      .required()
      .min(1, 'At least one edge group is required'),
  });
}
