import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { ConfigSpec } from '@/providers/infrastructure/docker';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { LabelsTab } from '@/domains/containers';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Input } from '@/ui/components/forms/Input';
import { FormSection } from '@/ui/components/forms/FormSection';
import { PageHeader } from '@/ui/layouts/view-layout';

import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { ConfigViewModel } from '../model';
import { queryKeys } from '../queries/query-keys';
import { getConfig } from '../queries/useConfig';
import { createConfig } from '../queries/useCreateConfigMutation';

interface Label {
  name: string;
  value: string;
}

export function CreateView() {
  const environmentId = useEnvironmentId();
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const cloneQuery = useQuery(
    [...queryKeys.base(environmentId), id],
    async () => new ConfigViewModel(await getConfig(environmentId, id)),
    { enabled: Boolean(id), ...withError('Unable to clone config') }
  );

  if (isLoading || (id && cloneQuery.isLoading)) {
    return null;
  }

  return (
    <CreateConfigForm
      environmentId={environmentId}
      isAdmin={isAdmin}
      userId={user.Id}
      source={cloneQuery.data}
    />
  );
}

function CreateConfigForm({
  environmentId,
  isAdmin,
  userId,
  source,
}: {
  environmentId: number;
  isAdmin: boolean;
  userId: number;
  source?: ConfigViewModel;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialContent = source?.Data || '';
  const [name, setName] = useState(source ? `${source.Name}_copy` : '');
  const [content, setContent] = useState(initialContent);
  const [labels, setLabels] = useState<Label[]>(() =>
    Object.entries(source?.Labels || {}).map(([name, value]) => ({
      name,
      value,
    }))
  );
  const [accessControl, setAccessControl] = useState<AccessControlFormData>(
    () => defaultValues(isAdmin, userId)
  );
  const createMutation = useMutation(
    handleCreate,
    withError('Unable to create config')
  );
  usePreventExit(initialContent, content, !createMutation.isSuccess);

  return (
    <>
      <PageHeader
        title="Create config"
        breadcrumbs={[
          { label: 'Configs', link: 'docker.configs' },
          'Add config',
        ]}
      />
      <Widget>
        <WidgetBody>
          <form className="form-horizontal" onSubmit={submit}>
            <FormControl label="Name" inputId="config_name" required>
              <Input
                id="config_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. myConfig"
                data-cy="config-name-input"
              />
            </FormControl>
            <WebEditorForm
              id="config-creation-editor"
              value={content}
              onChange={setContent}
              textTip="Define or paste the content of your config here"
              data-cy="config-creation-editor"
            />
            <LabelsTab values={labels} onChange={setLabels} />
            <AccessControlForm
              values={accessControl}
              onChange={setAccessControl}
              environmentId={environmentId}
            />
            <FormSection title="Actions">
              <LoadingButton
                loadingText="Creating config..."
                isLoading={createMutation.isLoading}
                disabled={!name || !content}
                className="!ml-0"
                data-cy="createConfig-submitButton"
              >
                Create config
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      accessControl.ownership === ResourceControlOwnership.RESTRICTED &&
      !accessControl.authorizedUsers.length &&
      !accessControl.authorizedTeams.length
    ) {
      notifyError(
        'Unable to create config',
        new Error('Select at least one user or team for restricted access.')
      );
      return;
    }
    createMutation.mutate();
  }

  async function handleCreate() {
    const spec: ConfigSpec = {
      Name: name,
      Data: encodeBase64(content),
      Labels: Object.fromEntries(
        labels
          .filter((label) => label.name && label.value)
          .map((label) => [label.name, label.value])
      ),
    };
    const response = await createConfig(environmentId, spec);
    const resourceControlId = response.Portainer?.ResourceControl?.Id;
    if (resourceControlId) {
      await applyResourceControl(accessControl, resourceControlId);
    }
    await queryClient.invalidateQueries(queryKeys.base(environmentId));
    notifySuccess('Success', 'Configuration successfully created');
    router.stateService.go('docker.configs');
  }
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}
