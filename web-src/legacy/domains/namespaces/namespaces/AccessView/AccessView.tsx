import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { NamespaceDetailsWidget } from './NamespaceDetailsWidget';
import { AccessDatatable } from './AccessDatatable/AccessDatatable';
import { CreateAccessWidget } from './CreateAccessWidget/CreateAccessWidget';

export function AccessView() {
  const { id: namespaceName } = useRouteParams();
  useUnauthorizedRedirect(
    { authorizations: ['K8sResourcePoolDetailsW'] },
    { to: '/:endpointId/kubernetes/namespaces' }
  );
  return (
    <>
      <PageHeader
        title="Namespace access management"
        breadcrumbs={[
          { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
          {
            label: namespaceName,
            link: '/:endpointId/kubernetes/namespaces/:id',
            linkParams: { id: namespaceName },
          },
          'Access management',
        ]}
        reload
      />
      <NamespaceDetailsWidget />
      <CreateAccessWidget />
      <AccessDatatable />
    </>
  );
}
