import { it, vi } from 'vitest';

import type { StackTrafficOverview } from '@/core/native-extensions/sdk';
import { trafficPanelCases } from '@/core/native-extensions/test-support/traffic-panel-suite';

import { TrafficPanel, counterRate } from './TrafficPanel';

vi.mock('./TrafficGraph', () => ({
  TrafficGraph: ({ snapshot }: { snapshot: StackTrafficOverview }) => (
    <div role="img" aria-label="Traffic topology">
      {snapshot.traffic.routers.map((router) => router.rule).join(', ')}
    </div>
  ),
}));

it.each(trafficPanelCases(TrafficPanel, counterRate))(
  '$name',
  ({ assertCase }) => assertCase()
);
