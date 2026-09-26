import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';

import { SecretSpec } from '@/providers/infrastructure/docker';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { createSecret } from '@/domains/services/secrets/queries/useSecrets';
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
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

interface Label {
  name: string;
  value: string;
}

interface CreateSecretResponse {
  Portainer?: { ResourceControl?: { Id: number } };
}

export function CreateView() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) {
    return null;
  }

  return <CreateSecretForm isAdmin={isAdmin} userId={user.Id} />;
}

function CreateSecretForm({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId: number;
}) {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [data, setData] = useState('');
  const [encode, setEncode] = useState(true);
  const [labels, setLabels] = useState<Label[]>([]);
  const [accessControl, setAccessControl] = useState<AccessControlFormData>(
    () => defaultValues(isAdmin, userId)
  );
  const createMutation = useMutation(
    handleCreate,
    withError('Unable to create secret')
  );

  return (
    <>
      <PageHeader
        title="Create secret"
        breadcrumbs={[
          { label: 'Secrets', link: 'docker.secrets' },
          'Add secret',
        ]}
      />
      <Widget>
        <WidgetBody>
          <form className="form-horizontal" onSubmit={submit}>
            <FormControl label="Name" inputId="secret_name" required>
              <Input
                id="secret_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. mySecret"
                data-cy="createSecret-nameInput"
              />
            </FormControl>
            <FormControl label="Secret" inputId="secret_data" required>
              <textarea
                id="secret_data"
                className="form-control"
                rows={5}
                value={data}
                onChange={(event) => setData(event.target.value)}
                data-cy="createSecret-secretDataInput"
              />
            </FormControl>
            <div className="form-group">
              <div className="col-sm-12">
                <SwitchField
                  data-cy="createSecret-encodeSwitch"
                  checked={encode}
                  label="Encode secret"
                  labelClass="col-sm-2"
                  onChange={setEncode}
                  tooltip="Secrets need to be base64 encoded. Disable this if your secret is already base64 encoded."
                />
              </div>
            </div>
            <LabelsTab values={labels} onChange={setLabels} />
            <AccessControlForm
              values={accessControl}
              onChange={setAccessControl}
              environmentId={environmentId}
            />
            <FormSection title="Actions">
              <LoadingButton
                loadingText="Creating secret..."
                isLoading={createMutation.isLoading}
                disabled={!name || !data}
                className="!ml-0"
                data-cy="createSecret-submitButton"
              >
                Create the secret
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
        'Unable to create secret',
        new Error('Select at least one user or team for restricted access.')
      );
      return;
    }
    createMutation.mutate();
  }

  async function handleCreate() {
    const spec: SecretSpec = {
      Name: name,
      Data: encode ? encodeBase64(data) : data,
      Labels: Object.fromEntries(
        labels
          .filter((label) => label.name)
          .map((label) => [label.name, label.value])
      ),
    };
    const response = (await createSecret(
      environmentId,
      spec
    )) as CreateSecretResponse;
    const resourceControlId = response.Portainer?.ResourceControl?.Id;
    if (resourceControlId) {
      await applyResourceControl(accessControl, resourceControlId);
    }
    await queryClient.invalidateQueries(['docker', environmentId, 'secrets']);
    notifySuccess('Success', 'Secret successfully created');
    router.stateService.go('docker.secrets');
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
