'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { ContainerEngine } from '@/domains/environments';
import { StackType } from '@/domains/stacks';
import { AppTemplatesList } from '@/domains/templates/app-templates/AppTemplatesList';
import { DeployForm } from '@/domains/templates/app-templates/DeployFormWidget/DeployFormWidget';
import { useAppTemplates } from '@/domains/templates/app-templates/queries/useAppTemplates';
import { TemplateType } from '@/domains/templates/app-templates/types';
import { CreateForm } from '@/domains/templates/custom-templates/CreateView/CreateForm';
import { EditForm } from '@/domains/templates/custom-templates/EditView/EditForm';
import { CustomTemplatesList } from '@/domains/templates/custom-templates/ListView/CustomTemplatesList';
import { StackFromCustomTemplateFormWidget } from '@/domains/templates/custom-templates/ListView/StackFromCustomTemplateFormWidget';
import { useViewParams } from '@/domains/templates/custom-templates/ListView/useViewParams';
import { useCustomTemplate } from '@/domains/templates/custom-templates/queries/useCustomTemplate';
import { useCustomTemplates } from '@/domains/templates/custom-templates/queries/useCustomTemplates';
import { useDeleteTemplateMutation } from '@/domains/templates/custom-templates/queries/useDeleteTemplateMutation';
import { CustomTemplate } from '@/domains/templates/custom-templates/types';
import {
  TemplateViewType,
  useViewType,
} from '@/domains/templates/custom-templates/useViewType';
import { useParamState } from '@/react/hooks/useParamState';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import {
  useIsSwarm,
  useIsSwarmManager,
} from '@/react/docker/proxy/queries/useInfo';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { useAuthorizations } from '@/react/hooks/useUser';
import { confirmDelete } from '@/ui/components/dialog/confirm';
import { notifySuccess } from '@/ui/components/toast/notifications';

import { Widget } from '@@/Widget';

export function AppTemplatesContent() {
  const environmentId = useEnvironmentId(false);
  const createAuthorization = useAuthorizations([
    'DockerContainerCreate',
    'PortainerStackCreate',
  ]);
  const [selectedId, setSelectedId] = useParamState<number>(
    'template',
    (value) => (value ? Number.parseInt(value, 10) : 0)
  );
  const templatesQuery = useAppTemplates({ environmentId });
  const selected = selectedId
    ? templatesQuery.data?.find((template) => template.Id === selectedId)
    : undefined;
  const filter = useAppTemplateFilter(environmentId);

  return (
    <>
      {selected && (
        <DeployForm template={selected} unselect={() => setSelectedId()} />
      )}
      <AppTemplatesList
        templates={templatesQuery.data}
        selectedId={selectedId}
        onSelect={
          environmentId && createAuthorization.authorized
            ? (template) => setSelectedId(template.Id)
            : undefined
        }
        disabledTypes={filter.disabledTypes}
        fixedCategories={filter.fixedCategories}
        storageKey={filter.tableKey}
        templateLinkParams={
          !environmentId
            ? (template) => ({
                to: '/edge/stacks/new',
                params: { templateId: template.Id, templateType: 'app' },
              })
            : undefined
        }
      />
    </>
  );
}

export function CustomTemplatesContent() {
  const { params, getTemplateLinkParams, storageKey, viewType } =
    useViewParams();
  const templatesQuery = useCustomTemplates({ params });
  const deleteTemplate = useDeleteTemplateMutation();
  const [selectedId] = useParamState<number>('template', (value) =>
    value ? Number.parseInt(value, 10) : 0
  );

  return (
    <>
      {viewType === ContainerEngine.Docker && Boolean(selectedId) && (
        <StackFromCustomTemplateFormWidget templateId={selectedId!} />
      )}
      <CustomTemplatesList
        templates={templatesQuery.data}
        onDelete={handleDelete}
        templateLinkParams={getTemplateLinkParams}
        storageKey={storageKey}
        selectedId={selectedId}
      />
    </>
  );

  async function handleDelete(id: CustomTemplate['Id']) {
    if (
      !(await confirmDelete('Are you sure you want to delete this template?'))
    ) {
      return;
    }
    deleteTemplate.mutate(id, {
      onSuccess: () => notifySuccess('Success', 'Template deleted'),
    });
  }
}

export function CustomTemplateCreateContent() {
  const viewType = useViewType();
  const environmentId = useEnvironmentId(false);
  const isSwarmManager = useIsSwarmManager(environmentId, {
    enabled: viewType === ContainerEngine.Docker,
  });

  return (
    <TemplateFormContent>
      <CreateForm
        viewType={viewType}
        environmentId={environmentId}
        defaultType={defaultTemplateType(viewType, isSwarmManager)}
      />
    </TemplateFormContent>
  );
}

export function CustomTemplateEditContent() {
  const viewType = useViewType();
  const environmentId = useEnvironmentId(false);
  const params = useRouteParams();
  const templateQuery = useCustomTemplate(Number(params.id));
  if (!templateQuery.data) return null;

  return (
    <TemplateFormContent>
      <EditForm
        environmentId={environmentId}
        template={templateQuery.data}
        viewType={viewType}
      />
    </TemplateFormContent>
  );
}

function TemplateFormContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Body>{children}</Widget.Body>
        </Widget>
      </div>
    </div>
  );
}

function useAppTemplateFilter(environmentId?: number) {
  const info = useIsSwarm(environmentId);
  const apiVersion = useApiVersion(environmentId);
  if (!environmentId) {
    return {
      disabledTypes: [TemplateType.Container],
      fixedCategories: ['edge'],
      tableKey: 'edge-app-templates',
    };
  }
  const showSwarm = apiVersion >= 1.25 && info;
  return {
    disabledTypes: !showSwarm ? [TemplateType.SwarmStack] : [],
    fixedCategories: undefined,
    tableKey: 'docker-app-templates',
  };
}

function defaultTemplateType(viewType: TemplateViewType, isSwarm: boolean) {
  if (viewType === 'kube') return StackType.Kubernetes;
  if (viewType === 'docker' && isSwarm) return StackType.DockerSwarm;
  return StackType.DockerCompose;
}
