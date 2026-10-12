import { KubernetesSnapshot } from '@/domains/environments';
import { humanize } from '@/shared/formatters';
import { CPUStats, GpuStats, MemoryStats, NodeStats } from '@/core/components/StatsItem';

import styles from './EnvironmentStatsKubernetes.module.css';

interface Props {
  snapshot?: KubernetesSnapshot;
}

export function EnvironmentStatsKubernetes({ snapshot }: Props) {
  if (!snapshot) {
    return <span className={styles.root}>No snapshot available</span>;
  }

  const totalGpuCount = Object.values(snapshot.TotalGPU ?? {}).reduce(
    (sum, v) => sum + v,
    0
  );

  return (
    <span className={styles.root}>
      {totalGpuCount > 0 && <GpuStats value={totalGpuCount} />}

      <NodeStats value={snapshot.NodeCount} />

      <CPUStats value={snapshot.TotalCPU} />

      <MemoryStats value={humanize(snapshot.TotalMemory)} />
    </span>
  );
}
