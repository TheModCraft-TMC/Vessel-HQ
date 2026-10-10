import { AccessTokenCreateContent } from '@app/_components/pages/AccessTokenCreatePage';
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
