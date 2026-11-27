import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { vi } from 'vitest';

import type { NativeExtensionProps } from '@/core/native-extensions/sdk';

export const stackContext = { environmentId: 1, stackId: 2, stackName: 'shop' };
export function stackDeliverySnapshot(workflowId: number) {
  return {
    ...stackContext,
    name: 'shop',
    version: 'reviewed-version',
    status: 1,
    workflowId,
    updatedAt: 0,
    deployedRevision: 'abc',
    syncStatus: 'synced',
    automaticSync: false,
    repullOnSync: false,
    sources: [],
    images: [
      {
        workloadId: 'web',
        name: 'Web',
        kind: 'container',
        reference: 'nginx:stable',
        policy: 'manual',
        status: 'outdated',
      },
    ],
  };
}
export const networkGraph = {
  ...stackContext,
  name: 'shop',
  networks: [],
  workloads: [],
};

export function stackDeliveryCases(
  Extension: ComponentType<NativeExtensionProps>,
  actionLabel: string,
  operation: 'stacks.gitops.sync' | 'stacks.images.update',
  workflowId: number
) {
  const snapshot = stackDeliverySnapshot(workflowId);
  return [
    {
      name: 'requires explicit confirmation and binds deployment to the reviewed stack version',
      assertCase: async () => {
        const invoke = vi
          .fn()
          .mockImplementation(async (capability: string) =>
            capability === 'stacks.network.read'
              ? networkGraph
              : capability === operation
                ? { accepted: true }
                : snapshot
          );
        render(<Extension context={stackContext} invoke={invoke} />);
        const action = await screen.findByRole('button', { name: actionLabel });
        expect(invoke).not.toHaveBeenCalledWith(operation, expect.anything());
        await userEvent.click(action);
        await userEvent.click(
          screen.getByRole('button', { name: 'Cancel deployment' })
        );
        expect(invoke).not.toHaveBeenCalledWith(operation, expect.anything());
        await userEvent.click(action);
        await userEvent.click(
          screen.getByRole('button', { name: 'Confirm deployment' })
        );
        await waitFor(() =>
          expect(invoke).toHaveBeenCalledWith(operation, {
            ...stackContext,
            version: 'reviewed-version',
          })
        );
        expect(await screen.findByText(/Deployment accepted/)).toBeVisible();
        expect(
          screen.getByRole('button', { name: actionLabel })
        ).toBeDisabled();
      },
    },
    {
      name: 'fails closed on cross-stack responses',
      assertCase: async () => {
        const invoke = vi
          .fn()
          .mockImplementation(async (capability: string) =>
            capability === 'stacks.network.read'
              ? networkGraph
              : { ...snapshot, stackId: 999 }
          );
        render(<Extension context={stackContext} invoke={invoke} />);
        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Unable to load this stack'
        );
        expect(
          screen.queryByRole('button', { name: actionLabel })
        ).not.toBeInTheDocument();
      },
    },
  ];
}
