'use client';

import { Package } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import SubscriptionIcon from '@/assets/ico/subscription.svg?c';
import { CreateContainerInstanceForm } from '@/domains/azure/views/ContainerInstances/CreateView/CreateContainerInstanceForm';
import { ContainersDatatable } from '@/domains/azure/components/ContainerInstances/ListView/ContainersDatatable';
import { PortsMappingField } from '@/domains/azure/components/ContainerInstances/PortsMappingField/PortsMappingField';
import {
  ContainerGroup,
  ResourceGroup,
  Subscription,
} from '@/domains/azure/models';
import { useContainerGroup } from '@/domains/azure/queries/useContainerGroup';
import { useContainerGroups } from '@/domains/azure/queries/useContainerGroups';
import { useResourceGroup } from '@/domains/azure/queries/useResourceGroup';
import { useResourceGroups } from '@/domains/azure/queries/useResourceGroups';
import { useSubscription } from '@/domains/azure/queries/useSubscription';
import { useSubscriptions } from '@/domains/azure/queries/useSubscriptions';
import { EnvironmentId } from '@/domains/environments';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { azureAciClient } from '@/providers/infrastructure/azure-aci';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSectionTitle } from '@/ui/components/forms/FormSectionTitle';
import { Input } from '@/ui/components/forms/Input';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';

import { DashboardItem } from '@@/DashboardItem';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { Widget, WidgetBody } from '@@/Widget';

export function AzureDashboardContent() {
  const environmentId = useEnvironmentId();
  const subscriptions = useSubscriptions(environmentId);
  const resourceGroups = useResourceGroups(environmentId, subscriptions.data);
  const resourceGroupCount = Object.values(
    resourceGroups.resourceGroups
  ).flatMap((groups) => Object.values(groups)).length;

  return (
    <div className="mx-4">
        {subscriptions.data && (
          <DashboardGrid>
            <DashboardItem
              value={subscriptions.data.length}
              data-cy="subscriptions-count"
              isLoading={subscriptions.isLoading}
              isRefetching={subscriptions.isRefetching}
              icon={SubscriptionIcon}
              type="Subscription"
            />
            {!resourceGroups.isError && !resourceGroups.isLoading && (
              <DashboardItem
                value={resourceGroupCount}
                data-cy="resource-groups-count"
                isLoading={resourceGroups.isLoading}
                icon={Package}
                type="Resource group"
              />
            )}
          </DashboardGrid>
        )}
      </div>
  );
}

export function AzureContainersContent() {
  const environmentId = useEnvironmentId();
  const subscriptions = useSubscriptions(environmentId);
  const groups = useContainerGroups(
    environmentId,
    subscriptions.data,
    subscriptions.isSuccess
  );
  const remove = useRemoveContainerGroups(environmentId);
  if (groups.isLoading || subscriptions.isLoading) return null;

  return (
    <ContainersDatatable
      dataset={groups.containerGroups}
      onRemoveClick={remove}
    />
  );
}

export function AzureContainerCreateContent() {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <CreateContainerInstanceForm />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}

export function AzureContainerDetailsContent() {
  const params = useRouteParams();
  const resourceId = params.id as string;
  const identifiers = parseResourceId(resourceId);
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const subscription = useSubscription(
    environmentId,
    identifiers.subscriptionId
  );
  const resourceGroup = useResourceGroup(
    environmentId,
    identifiers.subscriptionId,
    identifiers.resourceGroupId
  );
  const containerGroup = useContainerGroup(
    environmentId,
    identifiers.subscriptionId,
    identifiers.resourceGroupId,
    identifiers.containerGroupId
  );

  if (
    !subscription.isSuccess ||
    !resourceGroup.isSuccess ||
    !containerGroup.isSuccess
  ) {
    return null;
  }

  const container = aggregateContainer(
    subscription.data,
    resourceGroup.data,
    containerGroup.data
  );

  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody className="form-horizontal">
              <AzureSettingsFields container={container} />
              <AzureContainerFields container={container} />
              <AzureResourceFields container={container} />
              <AzureEnvironmentVariables
                variables={container.environmentVariables}
              />
            </WidgetBody>
          </Widget>
        </div>
      </div>
      <AccessControlPanel
        onUpdateSuccess={() =>
          queryClient.invalidateQueries([
            'azure',
            environmentId,
            'subscriptions',
            identifiers.subscriptionId,
            'resourceGroups',
            resourceGroup.data.name,
            'containerGroups',
            containerGroup.data.name,
          ])
        }
        resourceId={resourceId}
        resourceControl={container.resourceControl}
        resourceType={ResourceControlType.ContainerGroup}
        environmentId={environmentId}
      />
    </>
  );
}

type ContainerDetails = ReturnType<typeof aggregateContainer>;

function AzureSettingsFields({ container }: { container: ContainerDetails }) {
  return (
    <>
      <FormSectionTitle>Azure settings</FormSectionTitle>
      <ReadOnlyField
        id="subscription"
        label="Subscription"
        value={container.subscriptionName}
      />
      <ReadOnlyField
        id="resourceGroup"
        label="Resource group"
        value={container.resourceGroupName}
      />
      <ReadOnlyField
        id="location"
        label="Location"
        value={container.location}
      />
    </>
  );
}

function AzureContainerFields({ container }: { container: ContainerDetails }) {
  return (
    <>
      <FormSectionTitle>Container configuration</FormSectionTitle>
      <ReadOnlyField id="name" label="Name" value={container.name} />
      <ReadOnlyField id="image" label="Image" value={container.imageName} />
      <ReadOnlyField id="os" label="OS" value={container.osType} />
      <PortsMappingField value={container.ports} readOnly />
      <ReadOnlyField
        id="public-ip"
        label="Public IP"
        value={container.ipAddress}
      />
    </>
  );
}

function AzureResourceFields({ container }: { container: ContainerDetails }) {
  return (
    <>
      <FormSectionTitle>Container Resources</FormSectionTitle>
      <ReadOnlyField id="cpu" label="CPU" value={container.cpu} type="number" />
      <ReadOnlyField
        id="memory"
        label="Memory"
        value={container.memory}
        type="number"
      />
    </>
  );
}

function AzureEnvironmentVariables({
  variables,
}: {
  variables: ContainerDetails['environmentVariables'];
}) {
  if (!variables?.length) return null;
  return (
    <>
      <FormSectionTitle>Environment Variables</FormSectionTitle>
      <FormControl label="Environment variables" inputId="env-vars-input">
        <div data-cy="aci-container-env-vars-input">
          {variables.map((variable) => (
            <div key={variable.name}>
              {variable.name} ={' '}
              {variable.secureValue || variable.value === undefined
                ? '********'
                : variable.value}
            </div>
          ))}
        </div>
      </FormControl>
    </>
  );
}

function ReadOnlyField({
  id,
  label,
  value,
  type,
}: {
  id: string;
  label: string;
  value: string | number | undefined;
  type?: 'number';
}) {
  return (
    <FormControl label={label} inputId={`${id}-input`}>
      <Input
        name={id}
        id={`${id}-input`}
        type={type}
        value={value}
        readOnly
        data-cy={`aci-container-${id}-input`}
      />
    </FormControl>
  );
}

function useRemoveContainerGroups(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    (ids: string[]) =>
      promiseSequence(
        ids.map(
          (id) => () => azureAciClient.deleteContainerGroup(environmentId, id)
        )
      ),
    {
      onSuccess: () =>
        queryClient.invalidateQueries([
          'azure',
          environmentId,
          'subscriptions',
        ]),
      onError: (error) =>
        notifyError(
          'Failure',
          error as Error,
          'Unable to remove container groups'
        ),
    }
  );

  return (ids: string[]) =>
    mutation.mutate(ids, {
      onSuccess: () =>
        notifySuccess('Success', 'Container groups successfully removed'),
    });
}

function parseResourceId(id: string) {
  const match = id.match(
    /^\/subscriptions\/(.+)\/resourceGroups\/(.+)\/providers\/(.+)\/containerGroups\/(.+)$/
  );
  if (!match) throw new Error('container id is missing details');
  const [, subscriptionId, resourceGroupId, , containerGroupId] = match;
  return { subscriptionId, resourceGroupId, containerGroupId };
}

function aggregateContainer(
  subscription: Subscription,
  resourceGroup: ResourceGroup,
  containerGroup: ContainerGroup
) {
  const instance = containerGroup.properties.containers[0];
  const properties = instance?.properties;
  const ports = containerGroup.properties.ipAddress.ports.map(
    (binding, index) => ({
      container: properties?.ports?.[index]?.port,
      host: binding.port,
      protocol: binding.protocol,
    })
  );

  return {
    name: containerGroup.name,
    subscriptionName: subscription.displayName,
    resourceGroupName: resourceGroup.name,
    location: containerGroup.location,
    osType: containerGroup.properties.osType,
    ipAddress: containerGroup.properties.ipAddress.ip,
    resourceControl: containerGroup.resourceControl,
    imageName: properties?.image,
    ports,
    cpu: properties?.resources.cpu,
    memory: properties?.resources.memoryInGB,
    environmentVariables: properties?.environmentVariables,
  };
}
