import { AccessTokenCreateContent } from '@console/console/pages/AccessTokenCreatePage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function NewAccessTokenPage() {
  return (
    <>
      <PageHeader
        title="Create access token"
        breadcrumbs={[
          { label: 'My account', link: '/account' },
          'Add access token',
        ]}
        reload
      />
      <AccessTokenCreateContent />
    </>
  );
}
