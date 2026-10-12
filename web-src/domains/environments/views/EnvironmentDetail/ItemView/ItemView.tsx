import { PageContent } from '@console/layout/PageContent';

import { useIdParam } from '@/core/hooks/useIdParam';
import { PageHeader } from '@/ui/layouts/view-layout';
import { useEnvironment } from '@/domains/environments/queries/useEnvironment';
import {
  getPlatformTypeName,
  isEdgeEnvironment,
} from '@/domains/environments/utils';
import { EnvironmentDetailsForm } from '@/core/environment-management/environments/ItemView/EnvironmentDetailsForm';

import { EdgeInformationPanel } from '../EdgeInformationPanel/EdgeInformationPanel';
import { EdgeAgentDeploymentWidget } from '../EdgeAgentDeploymentWidget/EdgeAgentDeploymentWidget';
import { KubeConfigInfo } from '../KubeConfigInfo/KubeConfigInfo';

import styles from './ItemView.module.css';

export function ItemView({ environmentId }: { environmentId?: number } = {}) {
  const id = useIdParam('id', environmentId);
  const environmentQuery = useEnvironment(id);

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  const isEdge = isEdgeEnvironment(environment.Type);
  const platformName = getPlatformTypeName(environment.Type);

  return (
    <div className={styles.root}>
      <PageHeader
        title="Environment details"
        breadcrumbs={[
          { label: 'Environments', link: '/environments' },
          environment.Name,
        ]}
        reload
      />

      <PageContent>
        {isEdge &&
          (environment.EdgeID ? (
            <EdgeInformationPanel
              environmentId={id}
              edgeKey={environment.EdgeKey}
              edgeId={environment.EdgeID}
              platformName={platformName}
            />
          ) : (
            <EdgeAgentDeploymentWidget
              edgeKey={environment.EdgeKey}
              edgeId={environment.EdgeID}
              asyncMode={environment.Edge?.AsyncMode}
            />
          ))}

        <KubeConfigInfo
          environmentId={id}
          environmentType={environment.Type}
          edgeId={environment.EdgeID}
          status={environment.Status}
        />

        <EnvironmentDetailsForm environment={environment} />
      </PageContent>
    </div>
  );
}
