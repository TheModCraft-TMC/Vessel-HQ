import { consoleRoutes } from '@console/routes';

export interface SearchItem {
  href: string;
  title: string;
  description: string;
  kind?: string;
  keywords?: string[];
}

const globalItems: SearchItem[] = [
  {
    href: '/',
    title: 'Home',
    description: 'Open the environment overview.',
    keywords: ['dashboard'],
  },
  ...Object.entries(consoleRoutes).map(([href, route]) => ({
    href: `/${href}`,
    title: route.title,
    description: route.description,
  })),
];

const environmentItems = [
  ['Dashboard', 'docker', 'Review environment health and usage.'],
  ['Containers', 'docker/containers', 'Manage containers and lifecycle actions.'],
  ['Images', 'docker/images', 'Manage container images.'],
  ['Networks', 'docker/networks', 'Manage Docker networks.'],
  ['Volumes', 'docker/volumes', 'Manage persistent volumes.'],
  ['Stacks', 'docker/stacks', 'Manage Compose and GitOps stacks.'],
  ['Services', 'docker/services', 'Manage Swarm services.'],
  ['Host', 'docker/host', 'Inspect the Docker host.'],
] as const;

export function buildSearchItems(pathname: string): SearchItem[] {
  const endpointId = pathname.match(/^\/(\d+)\//)?.[1];
  if (!endpointId) return globalItems;

  return [
    ...environmentItems.map(([title, path, description]) => ({
      href: `/${endpointId}/${path}`,
      title,
      description,
      keywords: ['environment', 'docker'],
    })),
    ...globalItems,
  ];
}

export function filterSearchItems(items: SearchItem[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items.slice(0, 10);

  return items.filter((item) =>
    [item.title, item.description, item.kind, ...(item.keywords || [])]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}
