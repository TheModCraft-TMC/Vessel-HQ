import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { CreateNamespaceForm } from './CreateNamespaceForm';

export function CreateNamespaceView() {
  const environmentId = useEnvironmentId();

  useUnauthorizedRedirect(
    {
      authorizations: 'K8sResourcePoolsW',
      adminOnlyCE: !isBE,
    },
    {
      to: '/:endpointId/kubernetes/namespaces',
      params: {
        id: environmentId,
      },
    }
  );

  return (
    <div className="form-horizontal">
      <PageHeader
        title="Create a namespace"
        breadcrumbs={[
          { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
          'Create a namespace',
        ]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <CreateNamespaceForm />
        </div>
      </div>
    </div>
  );
}
