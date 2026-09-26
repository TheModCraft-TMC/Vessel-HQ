import { CpuIcon } from 'lucide-react';

import { humanize } from '@/portainer/filters/filters';
import memoryIcon from '@/assets/ico/memory.svg?c';
import { Icon } from '@/ui/components/icons/Icon';
import { DockerSnapshot } from '@/domains/environments';

export function SnapshotStats({
  snapshot,
}: {
  snapshot: DockerSnapshot | undefined;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <span className="small text-muted flex gap-2">
      <span className="flex items-center gap-1">
        <Icon icon={CpuIcon} /> {snapshot.TotalCPU}
      </span>
      <span className="flex items-center gap-1">
        <Icon icon={memoryIcon} />
        {humanize(snapshot.TotalMemory)}
      </span>
    </span>
  );
}
