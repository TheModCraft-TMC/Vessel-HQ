import { useCallback, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import NetworkExtension from '../examples/native-extensions/stack-network-overview/ui';
import GitOpsExtension from '../examples/native-extensions/stack-gitops/ui';
import ImagesExtension from '../examples/native-extensions/stack-image-updates/ui';

import type {
  NativeExtensionProps,
  StackDeliverySnapshot,
  StackNetworkOverview,
} from '../web-src/core/native-extensions/sdk';

const context = Object.freeze({
  environmentId: 1,
  stackId: 1,
  stackName: 'storefront',
});
const graph: StackNetworkOverview = {
  ...context,
  name: 'storefront',
  networks: [
    {
      id: 'frontend',
      name: 'Frontend',
      driver: 'bridge',
      scope: 'local',
      internal: false,
    },
    {
      id: 'database',
      name: 'Database',
      driver: 'bridge',
      scope: 'local',
      internal: true,
    },
  ],
  workloads: [
    {
      id: 'web',
      name: 'storefront-web',
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'frontend' }],
    },
    {
      id: 'api',
      name: 'storefront-api',
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'frontend' }, { networkId: 'database' }],
    },
    {
      id: 'db',
      name: 'storefront-db',
      kind: 'container',
      state: 'restarting',
      networks: [{ networkId: 'database' }],
    },
  ],
};
const initial: StackDeliverySnapshot = {
  ...context,
  name: 'storefront',
  version: 'disposable-fixture-version',
  status: 1,
  workflowId: 7,
  updatedAt: 1794499200,
  deployedRevision: 'a08c76b',
  syncStatus: 'out-of-sync',
  automaticSync: true,
  repullOnSync: true,
  sources: [
    {
      id: 2,
      name: 'Storefront deployment',
      ref: 'refs/heads/main',
      path: 'deploy/compose.yml',
      desiredRevision: 'b92d851',
      status: 1,
      interval: '5m',
    },
  ],
  images: [
    {
      workloadId: 'web',
      name: 'storefront-web',
      kind: 'container',
      reference: 'nginx:stable',
      status: 'outdated',
      policy: 'manual',
    },
    {
      workloadId: 'api',
      name: 'storefront-api',
      kind: 'container',
      reference: 'example/api:1.2',
      status: 'updated',
      policy: 'manual',
    },
  ],
};
function Fixture({
  view,
  width,
}: {
  view: 'network' | 'gitops' | 'images';
  width: number;
}) {
  const snapshot = useRef(structuredClone(initial));
  const [lastOperation, setLastOperation] = useState('');
  const invoke = useCallback<NativeExtensionProps['invoke']>(
    async <T,>(
      operation: Parameters<NativeExtensionProps['invoke']>[0],
      input: Parameters<NativeExtensionProps['invoke']>[1]
    ) => {
      setLastOperation(operation);
      if (operation === 'stacks.network.read') return graph as T;
      if (operation === 'stacks.images.configure') {
        if (!input.automation) throw new Error('Policy required');
        snapshot.current.automation = {
          ...input.automation,
          version: input.automation.version + 1,
          environmentId: 1,
          stackId: 1,
          lastCheck: 0,
          lastOutcome: 'Not scheduled',
        };
        return snapshot.current.automation as T;
      }
      if (
        operation === 'stacks.gitops.sync' ||
        operation === 'stacks.images.update'
      ) {
        snapshot.current.status = 3;
        return { accepted: true, environmentId: 1, stackId: 1 } as T;
      }
      return structuredClone(snapshot.current) as T;
    },
    []
  );
  const View =
    view === 'network'
      ? NetworkExtension
      : view === 'gitops'
        ? GitOpsExtension
        : ImagesExtension;
  return (
    <div style={{ width, maxWidth: '100%', padding: 16 }}>
      <View context={context} invoke={invoke} />
      <p role="status">Fixture operation: {lastOperation}</p>
    </div>
  );
}
const meta = {
  title: 'Extensions/Delivery suite',
  component: Fixture,
  args: { view: 'network', width: 1100 },
} satisfies Meta<typeof Fixture>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ResourceTree: Story = {};
export const GitOps: Story = { args: { view: 'gitops' } };
export const ImageUpdates: Story = { args: { view: 'images' } };
export const NarrowGitOps: Story = { args: { view: 'gitops', width: 390 } };
export const NarrowImageUpdates: Story = {
  args: { view: 'images', width: 390 },
};
