import { PageContent } from '@console/layout/PageContent';

import { withLimitToBE } from '@/core/hooks/useLimitToBE';
import { PageHeader } from '@/ui/layouts/view-layout';

import { AutomaticEdgeEnvCreation } from './AutomaticEdgeEnvCreation';

export const EdgeAutoCreateScriptViewWrapper = withLimitToBE(
  EdgeAutoCreateScriptView
);

function EdgeAutoCreateScriptView() {
  return (
    <>
      <PageHeader
        title="Automatic Edge Environment Creation"
        breadcrumbs={[
          { label: 'Environments', link: '/environments' },
          'Automatic Edge Environment Creation',
        ]}
        reload
      />

      <PageContent>
        <AutomaticEdgeEnvCreation />
      </PageContent>
    </>
  );
}
