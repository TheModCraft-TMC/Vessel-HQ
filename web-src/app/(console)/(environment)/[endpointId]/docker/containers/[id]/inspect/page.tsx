'use client';

import { useRouteParams } from '@console/routing/useRouteParams';
import { Circle, Code as CodeIcon, File } from 'lucide-react';
import { useState } from 'react';
import { PageContent } from '@console/layout/PageContent';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { ButtonSelector } from '@/ui/components/forms/ButtonSelector/ButtonSelector';
import { useContainerInspect } from '@/domains/containers/queries/useContainerInspect';
import { JsonTree } from '@/ui/components/JsonTree';
import { Widget } from '@/ui/components/Widget';
import { Code } from '@/ui/components/Code';

export default function Page() {
  const environmentId = useEnvironmentId();
  const { id, nodeName } = useRouteParams();
  const inspectQuery = useContainerInspect(environmentId, id, { nodeName });
  const [viewType, setViewType] = useState<'tree' | 'text'>('tree');

  if (!inspectQuery.data) {
    return null;
  }

  const containerInfo = inspectQuery.data;

  return (
    <PageContent>
      <Widget>
        <Widget.Title icon={Circle} title="Inspect">
          <ButtonSelector<'tree' | 'text'>
            onChange={(value) => setViewType(value)}
            value={viewType}
            options={[
              {
                label: 'Tree',
                icon: CodeIcon,
                value: 'tree',
              },
              {
                label: 'Text',
                icon: File,
                value: 'text',
              },
            ]}
          />
        </Widget.Title>
        <Widget.Body>
          {viewType === 'text' && (
            <Code showCopyButton>
              {JSON.stringify(containerInfo, undefined, 4)}
            </Code>
          )}
          {viewType === 'tree' && <JsonTree data={containerInfo} />}
        </Widget.Body>
      </Widget>
    </PageContent>
  );
}
