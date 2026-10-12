'use client';

import { PageContent } from '@console/layout/PageContent';

import { useEnvironment } from '@/domains/environments';
import { EdgeAgentDeploymentWidget } from '@/domains/environments/views/EnvironmentDetail/EdgeAgentDeploymentWidget/EdgeAgentDeploymentWidget';
import { EdgeInformationPanel } from '@/domains/environments/views/EnvironmentDetail/EdgeInformationPanel/EdgeInformationPanel';
import { KubeConfigInfo } from '@/domains/environments/views/EnvironmentDetail/KubeConfigInfo/KubeConfigInfo';
import { Environment } from '@/domains/environments';
import { EnvironmentDetailsForm } from '@/core/environment-management/environments/ItemView/EnvironmentDetailsForm';
import {
  getPlatformTypeName,
  isEdgeEnvironment,
} from '@/domains/environments/utils';
import { PageHeader } from '@/ui/layouts/view-layout';


export function EnvironmentDetailsHeader({
  environmentId,
}: {
  environmentId: number;
}) {
  const environmentQuery = useEnvironment(environmentId);

  return (
    <PageHeader
      title="Environment details"
      breadcrumbs={[
        { label: 'Environments', link: '/environments' },
        environmentQuery.data?.Name || 'Environment',
      ]}
      reload
    />
  );
}

export function EnvironmentDetailsContent({
  environmentId,
}: {
  environmentId: number;
}) {
  const environmentQuery = useEnvironment(environmentId);
  const environment = environmentQuery.data;

  if (!environment) return null;

  return (
    <PageContent>
      {isEdgeEnvironment(environment.Type) && (
        <EnvironmentEdgeConnection
          environmentId={environmentId}
          environment={environment}
        />
      )}
      <KubeConfigInfo
        environmentId={environmentId}
        environmentType={environment.Type}
        edgeId={environment.EdgeID}
        status={environment.Status}
      />
      <EnvironmentDetailsForm environment={environment} />
    </PageContent>
  );
}

function EnvironmentEdgeConnection({
  environmentId,
  environment,
}: {
  environmentId: number;
  environment: Environment;
}) {
  if (environment.EdgeID) {
    return (
      <EdgeInformationPanel
        environmentId={environmentId}
        edgeKey={environment.EdgeKey}
        edgeId={environment.EdgeID}
        platformName={getPlatformTypeName(environment.Type)}
      />
    );
  }

  return (
    <EdgeAgentDeploymentWidget
      edgeKey={environment.EdgeKey}
      edgeId={environment.EdgeID}
      asyncMode={environment.Edge?.AsyncMode}
    />
  );
}
