import { ExtensionsView } from '@/domains/extensions/views/ExtensionsView/ExtensionsView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function ExtensionsPage() {
  return (
    <>
      <PageHeader title="Extensions" breadcrumbs="Native extensions" reload />
      <ExtensionsView />
    </>
  );
}
