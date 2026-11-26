import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import {
  networkGraph,
  stackContext,
  stackDeliverySnapshot,
  testStackDelivery,
} from '@/core/native-extensions/test-support/stack-delivery-suite';

import Extension from './index';

const snapshot = stackDeliverySnapshot(0);

testStackDelivery(
  Extension,
  'Repull and redeploy stack',
  'stacks.images.update',
  0
);

it('blocks whole-stack updates when a workload is monitor-only', async () => {
  const invoke = vi.fn().mockImplementation(async (operation: string) =>
    operation === 'stacks.network.read'
      ? networkGraph
      : {
          ...snapshot,
          images: [{ ...snapshot.images[0], policy: 'monitor-only' }],
        }
  );
  render(<Extension context={stackContext} invoke={invoke} />);
  expect(
    await screen.findByRole('button', { name: 'Repull and redeploy stack' })
  ).toBeDisabled();
  expect(screen.getByText(/This stack includes excluded/)).toBeVisible();
});

it('requires explicit confirmation before enabling server-side automatic updates', async () => {
  const invoke = vi
    .fn()
    .mockImplementation(async (operation: string) =>
      operation === 'stacks.network.read' ? networkGraph : snapshot
    );
  render(<Extension context={stackContext} invoke={invoke} />);
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
      ...stackContext,
      automation: {
        version: 0,
        enabled: true,
        mode: 'automatic',
        intervalMinutes: 60,
      },
    })
  );
});
