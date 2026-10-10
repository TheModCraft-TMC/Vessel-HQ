import { useRouteParams } from '@console/console/routing/useRouteParams';
import { History } from 'lucide-react';

import { HelmRelease } from '@/domains/configuration/helm/types';

import { WidgetIcon } from '@@/Widget/WidgetIcon';


import { HelmRevisionItem } from './HelmRevisionItem';

export function HelmRevisionList({
  currentRevision,
  history,
}: {
  currentRevision?: number;
  history: HelmRelease[] | undefined;
}) {
  const params = useRouteParams();
  const { name, namespace } = params;

  if (!history) {
    return null;
  }

  return (
    <div className="h-0 min-h-full overflow-y-auto [scrollbar-gutter:stable]">
      <div className="p-5 pb-2.5">
        <span className="vertical-center mb-5">
          <WidgetIcon icon={History} />
          <h2 className="m-0 ml-1 text-base">Revisions</h2>
        </span>
        {history?.map((historyItem) => (
          <HelmRevisionItem
            key={historyItem.version}
            item={historyItem}
            namespace={namespace}
            name={name}
            currentRevision={currentRevision}
          />
        ))}
      </div>
    </div>
  );
}
