import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import YAML from 'yaml';

import { ServiceSpec } from '@/providers/infrastructure/docker';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { buildImageFullURI } from '@/domains/images';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Input } from '@/ui/components/forms/Input';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { getDefaultImageConfig } from '@@/ImageConfigFieldset/getImageConfig';
import { ImageConfigFieldset, ImageConfigValues } from '@@/ImageConfigFieldset';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { queryKeys } from '../queries/query-keys';
import { useCreateServiceMutation } from '../queries/useCreateServiceMutation';
import { ServiceUpdateConfig } from '../types';

const initialSpec: ServiceUpdateConfig = {
  Name: '',
  Labels: {},
  TaskTemplate: {
    ContainerSpec: { Image: '' },
    RestartPolicy: {
      Condition: 'any',
      Delay: 5_000_000_000,
      MaxAttempts: 0,
      Window: 0,
    },
    Placement: {},
  },
  Mode: { Replicated: { Replicas: 1 } },
  UpdateConfig: {
    Parallelism: 1,
    Delay: 0,
    FailureAction: 'pause',
    Order: 'stop-first',
  },
  Networks: [],
  EndpointSpec: { Mode: 'vip', Ports: [] },
};

export function CreateView() {
  const environmentId = useEnvironmentId();
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) {
    return null;
  }

  return (
    <CreateServiceForm
      environmentId={environmentId}
      isAdmin={isAdmin}
      userId={user.Id}
    />
  );
}

export function CreateServiceForm({
  environmentId,
  isAdmin,
  userId,
  showHeader = true,
}: {
  environmentId: number;
  isAdmin: boolean;
  userId: number;
  showHeader?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const registriesQuery = useEnvironmentRegistries(environmentId);
  const createMutation = useCreateServiceMutation(environmentId);
  const initialEditorValue = useMemo(() => YAML.stringify(initialSpec), []);
  const [name, setName] = useState('');
  const [image, setImage] = useState<ImageConfigValues>(() =>
    getDefaultImageConfig()
  );
  const [mode, setMode] = useState<'replicated' | 'global'>('replicated');
  const [replicas, setReplicas] = useState(1);
  const [editorValue, setEditorValue] = useState(initialEditorValue);
  const [editorError, setEditorError] = useState('');
  const [accessControl, setAccessControl] = useState<AccessControlFormData>(
    () => defaultValues(isAdmin, userId)
  );
  usePreventExit(initialEditorValue, editorValue, !createMutation.isSuccess);

  return (
    <>
      {showHeader && (
        <PageHeader
          title="Create service"
          breadcrumbs={[
            { label: 'Services', link: '/:endpointId/docker/services' },
            'Add service',
          ]}
        />
      )}
      <Widget>
        <WidgetBody>
          <form className="form-horizontal" onSubmit={handleSubmit}>
            <FormSection title="Service configuration">
              <FormControl label="Name" inputId="service-name" required>
                <Input
                  id="service-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. frontend"
                  data-cy="service-name-input"
                />
              </FormControl>

              <ImageConfigFieldset
                values={image}
                setFieldValue={(field, value) =>
                  setImage((current) => ({ ...current, [field]: value }))
                }
              />

              <FormControl label="Scheduling mode" inputId="service-mode">
                <select
                  id="service-mode"
                  className="form-control"
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as 'replicated' | 'global')
                  }
                  data-cy="service-mode-select"
                >
                  <option value="replicated">Replicated</option>
                  <option value="global">Global</option>
                </select>
              </FormControl>

              {mode === 'replicated' && (
                <FormControl label="Replicas" inputId="service-replicas">
                  <Input
                    id="service-replicas"
                    type="number"
                    min={0}
                    value={replicas}
                    onChange={(event) =>
                      setReplicas(Math.max(0, Number(event.target.value)))
                    }
                    data-cy="service-replicas-input"
                  />
                </FormControl>
              )}
            </FormSection>

            <FormSection title="Advanced specification">
              <TextTip>
                The editor exposes the complete Docker service specification.
                Name, image and scheduling mode above take precedence when the
                service is created.
              </TextTip>
              <WebEditorForm
                id="service-create-spec-editor"
                hideTitle
                value={editorValue}
                onChange={(value) => {
                  setEditorValue(value);
                  setEditorError('');
                }}
                error={editorError}
                data-cy="service-create-spec-editor"
                height="550px"
              />
            </FormSection>

            <AccessControlForm
              values={accessControl}
              onChange={setAccessControl}
              environmentId={environmentId}
            />

            <FormSection title="Actions">
              <LoadingButton
                isLoading={createMutation.isLoading}
                loadingText="Creating service..."
                disabled={!name || !image.image || createMutation.isLoading}
                className="!ml-0"
                data-cy="service-create-button"
              >
                Create service
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      accessControl.ownership === ResourceControlOwnership.RESTRICTED &&
      !accessControl.authorizedUsers.length &&
      !accessControl.authorizedTeams.length
    ) {
      notifyError(
        'Unable to create service',
        new Error('Select at least one user or team for restricted access.')
      );
      return;
    }

    const parsed = parseServiceSpec(editorValue);
    if (!parsed) {
      return;
    }

    const registry = image.registryId
      ? registriesQuery.data?.find(
          (item: { Id: number }) => item.Id === image.registryId
        )
      : undefined;
    let imageName: string;
    try {
      imageName = buildImageFullURI(image.image, registry);
    } catch (error) {
      notifyError('Unable to create service', error as Error);
      return;
    }

    const config: ServiceUpdateConfig = {
      ...parsed,
      Name: name,
      TaskTemplate: {
        ...parsed.TaskTemplate,
        ContainerSpec: {
          ...parsed.TaskTemplate.ContainerSpec,
          Image: imageName,
        },
      },
      Mode:
        mode === 'global'
          ? { Global: {} }
          : { Replicated: { Replicas: replicas } },
    };

    createMutation.mutate(
      {
        environmentId,
        config,
        registryId: image.registryId || undefined,
      },
      {
        onSuccess: async (service) => {
          const resourceControlId = service.Portainer?.ResourceControl?.Id;
          if (resourceControlId) {
            await applyResourceControl(accessControl, resourceControlId);
          }
          await queryClient.invalidateQueries(queryKeys.list(environmentId));
          notifySuccess('Success', 'Service successfully created');
          router.push(
            buildHref(
              '/:endpointId/docker/services/:id',
              {
                id: service.ID,
              },
              pathname
            )
          );
        },
      }
    );
  }

  function parseServiceSpec(value: string): ServiceUpdateConfig | undefined {
    try {
      const parsed = YAML.parse(value) as ServiceSpec | null;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('The service specification must be a YAML object.');
      }

      return {
        ...parsed,
        Name: parsed.Name || '',
        Labels: parsed.Labels || {},
        TaskTemplate: parsed.TaskTemplate || {},
        Mode: parsed.Mode || {},
        UpdateConfig: parsed.UpdateConfig || {},
        Networks: parsed.Networks || [],
        EndpointSpec: parsed.EndpointSpec || {},
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setEditorError(message);
      notifyError('Invalid service specification', new Error(message));
      return undefined;
    }
  }
}
