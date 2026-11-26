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
  workflowId: 0,
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
        : operation === 'stacks.images.update'
          ? { accepted: true }
          : snapshot
    );
  render(<Extension context={context} invoke={invoke} />);
  const action = await screen.findByRole('button', {
    name: 'Repull and redeploy stack',
  });
  expect(invoke).not.toHaveBeenCalledWith(
    'stacks.images.update',
    expect.anything()
  );
  await userEvent.click(action);
  await userEvent.click(
    screen.getByRole('button', { name: 'Cancel deployment' })
  );
  expect(invoke).not.toHaveBeenCalledWith(
    'stacks.images.update',
    expect.anything()
  );
  await userEvent.click(action);
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm deployment' })
  );
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith('stacks.images.update', {
      ...context,
      version: 'reviewed-version',
    })
  );
  expect(await screen.findByText(/Deployment accepted/)).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Repull and redeploy stack' })
  ).toBeDisabled();
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
    screen.queryByRole('button', { name: 'Repull and redeploy stack' })
  ).not.toBeInTheDocument();
});

it('blocks whole-stack updates when a workload is monitor-only', async () => {
  const invoke = vi.fn().mockImplementation(async (operation: string) =>
    operation === 'stacks.network.read'
      ? graph
      : {
          ...snapshot,
          images: [{ ...snapshot.images[0], policy: 'monitor-only' }],
        }
  );
  render(<Extension context={context} invoke={invoke} />);
  expect(
    await screen.findByRole('button', { name: 'Repull and redeploy stack' })
  ).toBeDisabled();
  expect(screen.getByText(/This stack includes excluded/)).toBeVisible();
});

it('requires explicit confirmation before enabling server-side automatic updates', async () => {
  const invoke = vi
    .fn()
    .mockImplementation(async (operation: string) =>
      operation === 'stacks.network.read' ? graph : snapshot
    );
  render(<Extension context={context} invoke={invoke} />);
  await screen.findByRole('button', { name: 'Save background policy' });
  await userEvent.click(screen.getByLabelText('Enable background checks'));
  await userEvent.selectOptions(screen.getByLabelText('Mode'), 'automatic');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save background policy' })
  );
  expect(invoke).not.toHaveBeenCalledWith(
    'stacks.images.configure',
    expect.anything()
  );
  await userEvent.click(screen.getByRole('button', { name: 'Confirm policy' }));
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith('stacks.images.configure', {
      ...context,
      automation: {
        version: 0,
        enabled: true,
        mode: 'automatic',
        intervalMinutes: 60,
      },
    })
  );
});
