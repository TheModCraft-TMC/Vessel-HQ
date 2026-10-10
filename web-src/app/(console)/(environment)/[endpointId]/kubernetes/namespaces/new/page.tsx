import { KubernetesNamespaceCreateContent } from '@app/_components/platform/kubernetes/KubernetesNamespacePages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create a namespace"
        breadcrumbs={[
          { label: 'Namespaces', link: '/:endpointId/kubernetes/namespaces' },
          'Create a namespace',
        ]}
        reload
      />
      <KubernetesNamespaceCreateContent />
    </>
  );
}
