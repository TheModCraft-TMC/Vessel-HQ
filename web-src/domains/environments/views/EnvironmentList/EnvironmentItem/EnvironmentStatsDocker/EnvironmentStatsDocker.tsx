import { DockerSnapshot } from '@/domains/environments';
import { humanize } from '@/shared/formatters';
import { ContainerStats, CPUStats, MemoryStats, NodeStats } from '@/core/components/StatsItem';

import styles from './EnvironmentStatsDocker.module.css';

interface Props {
  snapshot?: DockerSnapshot;
}

export function EnvironmentStatsDocker({ snapshot }: Props) {
  if (!snapshot) {
    return <span className={styles.root}>No snapshot available</span>;
  }

  return (
    <span className={styles.root}>
      <ContainerStats
        total={snapshot.ContainerCount}
        running={snapshot.RunningContainerCount}
        stopped={snapshot.StoppedContainerCount}
      />

      <NodeStats value={snapshot.NodeCount} />

      <CPUStats value={snapshot.TotalCPU} />

      <MemoryStats value={humanize(snapshot.TotalMemory)} />
    </span>
  );
}
