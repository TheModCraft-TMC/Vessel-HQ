'use client';

import { EdgeAgentDeploymentWidget } from '@/domains/environments/views/EnvironmentDetail/EdgeAgentDeploymentWidget/EdgeAgentDeploymentWidget';
import { EdgeInformationPanel } from '@/domains/environments/views/EnvironmentDetail/EdgeInformationPanel/EdgeInformationPanel';
import { KubeConfigInfo } from '@/domains/environments/views/EnvironmentDetail/KubeConfigInfo/KubeConfigInfo';
import { Environment } from '@/domains/environments';
import { useEnvironment } from '@/domains/environments/queries/useEnvironment';
import { EnvironmentDetailsForm } from '@/react/portainer/environments/ItemView/EnvironmentDetailsForm';
import {
  getPlatformTypeName,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
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
    <div className="mx-4 space-y-4 [&>*]:block">
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
      </div>
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
