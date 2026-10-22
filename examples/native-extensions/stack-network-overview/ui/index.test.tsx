import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import StackNetworkOverview, { type StackNetworkExtensionProps } from './index';
import type { StackNetworkTopology } from './topology';

vi.mock('./GraphViewport', () => ({ GraphViewport: () => null }));

vi.mock('@xyflow/react', () => ({
  ReactFlow: ({
    defaultNodes,
    defaultEdges,
    children,
  }: {
    defaultNodes: unknown[];
    defaultEdges: unknown[];
    children: React.ReactNode;
  }) => (
    <div aria-label="Rendered topology graph">
      {defaultNodes.length} nodes, {defaultEdges.length} connections{children}
    </div>
  ),
  Background: () => <span>Graph background</span>,
  Controls: () => <span>Graph controls</span>,
  MiniMap: () => <span>Graph minimap</span>,
  Handle: () => null,
  Position: { Right: 'right', Left: 'left' },
}));

const context = { environmentId: 2, stackId: 5, stackName: 'shop' };
const topology: StackNetworkTopology = {
  ...context,
  name: 'shop',
  networks: [
    {
      id: 'front',
      name: 'Frontend',
      driver: 'bridge',
      scope: 'local',
      internal: false,
    },
  ],
  workloads: [
    {
      id: 'web',
      name: 'Web',
      kind: 'container',
      state: 'running',
      networks: [{ networkId: 'front' }],
    },
  ],
};

function invokeReturning(
  data: StackNetworkTopology
): StackNetworkExtensionProps['invoke'] {
  return vi.fn().mockResolvedValue(data);
}

it('requests only the selected stack and renders a real graph with a text alternative', async () => {
  const invoke = invokeReturning(topology);
  render(<StackNetworkOverview context={context} invoke={invoke} />);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Reading stack networks'
  );
  expect(
    await screen.findByLabelText('Rendered topology graph')
  ).toHaveTextContent('2 nodes, 1 connections');
  expect(invoke).toHaveBeenCalledExactlyOnceWith('stacks.network.read', {
    environmentId: 2,
    stackId: 5,
  });
  await userEvent.click(
    screen.getByText('View network attachments as a table')
  );
  expect(screen.getByRole('table')).toBeVisible();
  expect(
    screen.getByRole('row', { name: 'Web container running Frontend' })
  ).toBeVisible();
});

it('shows an explicit scope denial without graph data', async () => {
  const invoke = vi
    .fn()
    .mockRejectedValue(new Error('Permission denied for this environment'));
  render(<StackNetworkOverview context={context} invoke={invoke} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Permission denied for this environment'
  );
  expect(
    screen.queryByLabelText('Rendered topology graph')
  ).not.toBeInTheDocument();
});

it('does not accept a response for a different stack', async () => {
  render(
    <StackNetworkOverview
      context={context}
      invoke={invokeReturning({ ...topology, stackId: 99 })}
    />
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'does not match the selected stack'
  );
  expect(
    screen.queryByLabelText('Rendered topology graph')
  ).not.toBeInTheDocument();
});

it('handles an empty stack and refreshes only on request', async () => {
  const invoke = invokeReturning({ ...topology, networks: [], workloads: [] });
  render(<StackNetworkOverview context={context} invoke={invoke} />);
  expect(
    await screen.findByText(
      'No networks or workloads were found for this stack.'
    )
  ).toBeVisible();
  expect(invoke).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Refresh topology' })
  );
  await waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
});

it('blocks missing stack scope before invoking the host', async () => {
  const invoke = invokeReturning(topology);
  render(
    <StackNetworkOverview
      context={{ ...context, stackId: 0 }}
      invoke={invoke}
    />
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Select a valid stack and environment'
  );
  expect(invoke).not.toHaveBeenCalled();
});

it('ignores a stale response after the selected stack changes', async () => {
  let resolveFirst: (data: StackNetworkTopology) => void = () => undefined;
  const first = new Promise<StackNetworkTopology>((resolve) => {
    resolveFirst = resolve;
  });
  const invoke = vi
    .fn()
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce({ ...topology, stackId: 6, name: 'other' });
  const view = render(
    <StackNetworkOverview context={context} invoke={invoke} />
  );
  view.rerender(
    <StackNetworkOverview
      context={{ ...context, stackId: 6, stackName: 'other' }}
      invoke={invoke}
    />
  );
  await screen.findByLabelText('Rendered topology graph');
  await act(async () => {
    resolveFirst(topology);
    await first;
  });
  expect(
    screen.getByText('other · Networks and workloads in this stack')
  ).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
