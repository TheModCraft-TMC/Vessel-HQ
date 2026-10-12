'use client';

import { PageContent } from '@console/layout/PageContent';

import { AutomaticEdgeEnvCreation } from '@/domains/edge/views/environments/EdgeAutoCreateScriptView/AutomaticEdgeEnvCreation';

export function EdgeAutoCreateContent() {
  return (
    <PageContent>
      <AutomaticEdgeEnvCreation />
    </PageContent>
  );
}
