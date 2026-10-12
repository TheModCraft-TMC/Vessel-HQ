import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { useUnauthorizedRedirect } from '@/core/routing/useUnauthorizedRedirect';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Widget, WidgetBody } from '@/ui/components/Widget';

import { ConfigureForm } from './ConfigureForm';

export function ConfigureView() {
  const { data: environment } = useCurrentEnvironment();

  useUnauthorizedRedirect(
    {
      authorizations: 'K8sClusterW',
      adminOnlyCE: false,
    },
    {
      params: {
        id: environment?.Id,
      },
      to: '/:endpointId/kubernetes/dashboard',
    }
  );

  return (
    <>
      <PageHeader
        title="Kubernetes features configuration"
        breadcrumbs={[
          { label: 'Environments', link: '/environments' },
          {
            label: environment?.Name || '',
            link: '/environments/:id',
            linkParams: { id: environment?.Id },
          },
          'Kubernetes configuration',
        ]}
        reload
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <ConfigureForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
