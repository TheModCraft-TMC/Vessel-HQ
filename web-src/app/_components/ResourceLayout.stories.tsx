import type { Meta, StoryObj } from '@storybook/react';
import { waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import { withTestRouter } from '@/core/test-support/withRouter';
import { withUserProvider } from '@/core/test-support/withUserProvider';

import Images from '../(console)/(environment)/[endpointId]/docker/images/(list)/page';
import Networks from '../(console)/(environment)/[endpointId]/docker/networks/(list)/page';
import Volumes from '../(console)/(environment)/[endpointId]/docker/volumes/(list)/page';
import BuildImage from '../(console)/(environment)/[endpointId]/docker/images/build/page';
import ImportImage from '../(console)/(environment)/[endpointId]/docker/images/import/page';
import CreateNetwork from '../(console)/(environment)/[endpointId]/docker/networks/new/(create)/page';
import CreateVolume from '../(console)/(environment)/[endpointId]/docker/volumes/new/(create)/page';

const pages = {
  images: Images,
  networks: Networks,
  volumes: Volumes,
  build: BuildImage,
  import: ImportImage,
  network: CreateNetwork,
  volume: CreateVolume,
};

type Surface = keyof typeof pages;
type Args = { surface: Surface; width: number };

const RouteSurface = withUserProvider(
  withTestRouter(
    ({ surface }: { surface: Surface }) => {
      const Page = pages[surface];
      return (
        <div data-cy="resource-layout-shell" style={{ padding: 15 }}>
          <style>{'[data-legacy-page-header] { display: none; }'}</style>
          <output data-cy="resource-layout-result">Checking layout…</output>
          <Page />
        </div>
      );
    },
    {
      route: 'fixture',
      stateConfig: [{ name: 'fixture', params: { endpointId: 901 } }],
    }
  )
);

const meta = {
  title: 'Console/Resource layout',
  args: { surface: 'images', width: 1024 },
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.get('/api/docker/:id/images', () =>
          HttpResponse.json([
            {
              id: `sha256:${'a'.repeat(64)}`,
              tags: ['vessel-layout-fixture/service:desktop-review'],
              created: 1794355200,
              size: 104857600,
              used: true,
            },
          ])
        ),
        http.get('/api/endpoints/:id/docker/images/json', () =>
          HttpResponse.json([
            {
              Id: `sha256:${'a'.repeat(64)}`,
              RepoTags: ['vessel-layout-fixture/service:desktop-review'],
              Created: 1794355200,
              Size: 104857600,
              Containers: 1,
              Labels: {},
            },
          ])
        ),
        http.get('/api/endpoints/:id/docker/networks', () =>
          HttpResponse.json([
            {
              Id: 'layout-fixture-network',
              Name: 'vessel-layout-fixture-network',
              Driver: 'bridge',
              Scope: 'local',
              Internal: false,
              Attachable: false,
              EnableIPv6: false,
              IPAM: {
                Driver: 'default',
                Config: [{ Subnet: '172.30.0.0/24', Gateway: '172.30.0.1' }],
              },
              Containers: {},
              Labels: {},
              Options: {},
            },
          ])
        ),
        http.get('/api/endpoints/:id/docker/volumes', ({ request }) =>
          HttpResponse.json({
            Volumes: new URL(request.url).searchParams
              .get('filters')
              ?.includes('true')
              ? []
              : [
                  {
                    Name: 'vessel-layout-fixture-data',
                    Driver: 'local',
                    Scope: 'local',
                    Mountpoint: '/fixture/data',
                    CreatedAt: '2026-11-11T00:00:00Z',
                    Labels: {},
                    Options: {},
                  },
                ],
          })
        ),
        http.get('/api/endpoints/:id/docker/plugins', () =>
          HttpResponse.json([])
        ),
      ],
    },
  },
} satisfies Meta<Args>;
export default meta;

type Story = StoryObj<Args>;

/** Real route components and shared CSS, with read-only local API fixtures. */
export const Surface: Story = {
  render: ({ surface }) => <RouteSurface surface={surface} />,
  play: async ({ canvasElement, args }) => {
    await waitFor(
      () => {
        if (
          ['images', 'networks', 'volumes'].includes(args.surface) &&
          !canvasElement.textContent?.includes('vessel-layout-fixture')
        )
          throw new Error('Resource fixture rows have not rendered');
        const cards = [
          ...canvasElement.querySelectorAll<HTMLElement>('.widget'),
        ].filter((card) => !card.parentElement?.closest('.widget'));
        if (!cards.length) throw new Error('Resource card has not rendered');
        const doc = canvasElement.ownerDocument;
        const shell = canvasElement
          .querySelector<HTMLElement>('[data-cy="resource-layout-shell"]')!
          .getBoundingClientRect();
        if (
          doc.documentElement.scrollWidth >
          doc.documentElement.clientWidth + 1
        )
          throw new Error('Resource page overflows horizontally');
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          if (
            Math.abs(rect.left - shell.left - 31) > 1 ||
            Math.abs(shell.right - rect.right - 31) > 1
          )
            throw new Error(
              `Card inset differs from shared 31px content grid: ${rect.left}, ${rect.right}`
            );
        }
        for (const toolbar of canvasElement.querySelectorAll<HTMLElement>(
          '.toolBar'
        )) {
          if (toolbar.scrollWidth > toolbar.clientWidth + 1)
            throw new Error('Table toolbar overflows its card');
        }
        const result = canvasElement.querySelector<HTMLOutputElement>(
          '[data-cy="resource-layout-result"]'
        )!;
        result.dataset.layoutCheck = 'passed';
        result.textContent = `${args.surface}: layout passed at ${doc.documentElement.clientWidth}px`;
      },
      { timeout: 15000 }
    );
  },
};

/** An iframe supplies an actual viewport for both desktop and phone media queries. */
export const Viewport: Story = {
  render: ({ surface, width }) => (
    <iframe
      title={`${surface} layout at ${width}px`}
      src={`./iframe.html?id=console-resource-layout--surface&viewMode=story&args=surface:${surface}`}
      style={{ width, height: 1000, border: 0, display: 'block' }}
    />
  ),
};
