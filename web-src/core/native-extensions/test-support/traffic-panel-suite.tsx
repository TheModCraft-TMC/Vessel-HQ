import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ComponentType } from 'react';

import type {
  NativeExtensionProps,
  StackTrafficOverview,
} from '@/core/native-extensions/sdk';

const context = { environmentId: 1, stackId: 2, stackName: 'shop' };
function snapshot(
  time = '2026-10-16T00:00:05Z',
  received = '9007199254742016'
): StackTrafficOverview {
  return {
    ...context,
    name: 'shop',
    networks: [],
    workloads: [
      {
        id: 'web',
        name: 'shop-web',
        kind: 'container',
        state: 'running',
        networks: [],
      },
    ],
    traffic: {
      collectedAt: time,
      routers: [
        {
          id: 'app',
          protocol: 'http',
          workloadId: 'web',
          rule: 'Host(`shop.test`)',
          service: 'app',
          entryPoints: ['websecure'],
          middlewares: [],
          tls: true,
        },
      ],
      services: [
        {
          id: 'app',
          protocol: 'http',
          workloadId: 'web',
          port: 8080,
          scheme: 'http',
        },
      ],
      middlewares: [],
      counters: [
        {
          workloadId: 'web',
          available: true,
          receivedBytes: received,
          sentBytes: '512',
          reason: '',
        },
      ],
      warnings: [],
    },
  };
}

type TrafficPanelProps = NativeExtensionProps & { mode: 'traffic' | 'config' };
type CounterRate = (
  previous: StackTrafficOverview | undefined,
  current: StackTrafficOverview,
  workloadId: string,
  direction: 'receivedBytes' | 'sentBytes'
) => string;

export function trafficPanelCases(
  TrafficPanel: ComponentType<TrafficPanelProps>,
  counterRate: CounterRate
) {
  return [
    {
      name: 'calculates real deltas without rounding cumulative counters and handles resets',
      assertCase: () => {
        const before = snapshot('2026-10-16T00:00:00Z', '9007199254740992');
        expect(counterRate(before, snapshot(), 'web', 'receivedBytes')).toBe(
          '0.20 KiB/s'
        );
        expect(
          counterRate(
            before,
            snapshot('2026-10-16T00:00:05Z', '0'),
            'web',
            'receivedBytes'
          )
        ).toMatch(/reset/);
        expect(
          counterRate(undefined, snapshot(), 'web', 'receivedBytes')
        ).toMatch(/two samples/);
      },
    },
    {
      name: 'renders routes from its bound host operation and aborts live sampling on unmount',
      assertCase: async () => {
        const invoke = vi.fn().mockResolvedValue(snapshot());
        let signal: AbortSignal | undefined;
        const watchTraffic: NonNullable<NativeExtensionProps['watchTraffic']> =
          vi.fn((_accept, incoming) => {
            signal = incoming;
            return new Promise<void>((resolve) =>
              incoming.addEventListener('abort', () => resolve(), {
                once: true,
              })
            );
          });
        const view = render(
          <TrafficPanel
            context={context}
            invoke={invoke}
            watchTraffic={watchTraffic}
            mode="traffic"
          />
        );
        expect(
          await screen.findByRole('img', { name: 'Traffic topology' })
        ).toHaveTextContent('Host(`shop.test`)');
        expect(invoke).toHaveBeenCalledWith('stacks.traffic.read', {
          environmentId: 1,
          stackId: 2,
        });
        expect(
          screen.getByText(/HTTP request counts and per-route latency/)
        ).toBeVisible();
        await userEvent.click(
          screen.getByRole('button', { name: 'Start live traffic' })
        );
        expect(signal?.aborted).toBe(false);
        view.unmount();
        await waitFor(() => expect(signal?.aborted).toBe(true));
      },
    },
    {
      name: 'rejects a response for another stack and does not show its routes',
      assertCase: async () => {
        const invoke = vi
          .fn()
          .mockResolvedValue({ ...snapshot(), stackId: 99 });
        render(
          <TrafficPanel context={context} invoke={invoke} mode="config" />
        );
        expect(await screen.findByRole('alert')).toHaveTextContent(
          'does not match this stack'
        );
        expect(screen.queryByText('Host(`shop.test`)')).not.toBeInTheDocument();
      },
    },
    ...['environment', 'stack'].map((scope) => ({
      name: `discards traffic and aborts the old stream when the ${scope} changes`,
      assertCase: async () => {
        const invoke = vi
          .fn()
          .mockResolvedValueOnce(snapshot())
          .mockImplementationOnce(
            () =>
              new Promise(() => {
                // A pending request keeps the new scope in its loading state.
              })
          );
        let signal: AbortSignal | undefined;
        const watchTraffic: NonNullable<NativeExtensionProps['watchTraffic']> =
          vi.fn((_accept, incoming) => {
            signal = incoming;
            return new Promise<void>((resolve) =>
              incoming.addEventListener('abort', () => resolve(), {
                once: true,
              })
            );
          });
        const view = render(
          <TrafficPanel
            context={context}
            invoke={invoke}
            watchTraffic={watchTraffic}
            mode="traffic"
          />
        );
        await screen.findByRole('img', { name: 'Traffic topology' });
        await userEvent.click(
          screen.getByRole('button', { name: 'Start live traffic' })
        );
        expect(signal?.aborted).toBe(false);

        const nextContext = {
          ...context,
          ...(scope === 'environment' ? { environmentId: 3 } : { stackId: 4 }),
        };
        view.rerender(
          <TrafficPanel
            context={nextContext}
            invoke={invoke}
            watchTraffic={watchTraffic}
            mode="traffic"
          />
        );

        expect(signal?.aborted).toBe(true);
        expect(
          screen.queryByRole('img', { name: 'Traffic topology' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(
          'Loading routing labels and Docker counters'
        );
        expect(
          screen.getByRole('button', { name: 'Start live traffic' })
        ).toBeDisabled();
        expect(invoke).toHaveBeenLastCalledWith('stacks.traffic.read', {
          environmentId: nextContext.environmentId,
          stackId: nextContext.stackId,
        });
      },
    })),
    ...['not-a-date', ''].map((time) => ({
      name: `rejects an invalid sample timestamp ${JSON.stringify(time)}`,
      assertCase: () => {
        const before = snapshot('2026-10-16T00:00:00Z', '9007199254740992');
        expect(
          counterRate(before, snapshot(time), 'web', 'receivedBytes')
        ).toBe('Counter reset or invalid interval');
        expect(
          counterRate(snapshot(time), before, 'web', 'receivedBytes')
        ).toBe('Counter reset or invalid interval');
      },
    })),
  ];
}
