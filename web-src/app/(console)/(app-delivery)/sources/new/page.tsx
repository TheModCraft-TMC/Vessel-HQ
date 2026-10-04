import { SourceCreateContent } from '@console/console/pages/SourceCreatePage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function NewSourcePage() {
  return (
    <div className="form-horizontal pb-20">
      <PageHeader
        title="Create Source"
        breadcrumbs={[
          { link: '/sources', label: 'GitOps Sources' },
          { label: 'Create Source' },
        ]}
        reload
      />
      <SourceCreateContent />
    </div>
  );
}
