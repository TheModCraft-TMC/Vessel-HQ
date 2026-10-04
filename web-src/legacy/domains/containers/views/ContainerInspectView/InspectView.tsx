import { useRouteParams } from '@console/console/routing/useRouteParams';
import { Circle, Code as CodeIcon, File } from 'lucide-react';
import { useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';
import { ButtonSelector } from '@/ui/components/forms/ButtonSelector/ButtonSelector';

import { JsonTree } from '@@/JsonTree';
import { Widget } from '@@/Widget';
import { Code } from '@@/Code';

import { useContainerInspect } from '../../queries/useContainerInspect';

export function InspectView() {
  return (
    <>
      <PageHeader title="Container inspect" breadcrumbs="Containers" />
      <ContainerInspectContent />
    </>
  );
}

export function ContainerInspectContent() {
  const environmentId = useEnvironmentId();
  const { id, nodeName } = useRouteParams();
  const inspectQuery = useContainerInspect(environmentId, id, { nodeName });
  const [viewType, setViewType] = useState<'tree' | 'text'>('tree');

  if (!inspectQuery.data) {
    return null;
  }

  const containerInfo = inspectQuery.data;

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
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
      </div>
    </div>
  );
}
