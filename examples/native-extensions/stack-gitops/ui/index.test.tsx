import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Extension from './index';
const context = { environmentId: 1, stackId: 2, stackName: 'shop' };
const snapshot = {
  ...context,
  name: 'shop',
  version: 'reviewed-version',
  status: 1,
  workflowId: 1,
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
const graph = { ...context, name: 'shop', networks: [], workloads: [] };
it('requires explicit confirmation and binds deployment to the reviewed stack version', async () => {
  const invoke = vi
    .fn()
    .mockImplementation(async (operation: string) =>
      operation === 'stacks.network.read'
        ? graph
        : operation === 'stacks.gitops.sync'
          ? { accepted: true }
          : snapshot
    );
  render(<Extension context={context} invoke={invoke} />);
  const action = await screen.findByRole('button', { name: 'Sync from Git' });
  expect(invoke).not.toHaveBeenCalledWith(
    'stacks.gitops.sync',
    expect.anything()
  );
  await userEvent.click(action);
  await userEvent.click(
    screen.getByRole('button', { name: 'Cancel deployment' })
  );
  expect(invoke).not.toHaveBeenCalledWith(
    'stacks.gitops.sync',
    expect.anything()
  );
  await userEvent.click(action);
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm deployment' })
  );
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith('stacks.gitops.sync', {
      ...context,
      version: 'reviewed-version',
    })
  );
  expect(await screen.findByText(/Deployment accepted/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sync from Git' })).toBeDisabled();
});
it('fails closed on cross-stack responses', async () => {
  const invoke = vi
    .fn()
    .mockImplementation(async (operation: string) =>
      operation === 'stacks.network.read'
        ? graph
        : { ...snapshot, stackId: 999 }
    );
  render(<Extension context={context} invoke={invoke} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load this stack'
  );
  expect(
    screen.queryByRole('button', { name: 'Sync from Git' })
  ).not.toBeInTheDocument();
});
