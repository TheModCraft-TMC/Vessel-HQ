export interface HeaderBreadcrumb {
  label: string;
  href?: string;
}

const segmentLabels: Record<string, string> = {
  account: 'Account',
  access: 'Access',
  activity: 'Activity',
  'activity-logs': 'Activity logs',
  attach: 'Console',
  azure: 'Azure',
  cluster: 'Cluster',
  configmaps: 'ConfigMaps',
  configurations: 'Configurations',
  containerinstances: 'Container instances',
  containers: 'Containers',
  dashboard: 'Dashboard',
  deploy: 'Deploy',
  docker: 'Docker',
  edge: 'Edge',
  environments: 'Environments',
  extensions: 'Extensions',
  exec: 'Console',
  groups: 'Environment groups',
  helm: 'Helm',
  images: 'Images',
  ingresses: 'Ingresses',
  inspect: 'Inspect',
  jobs: 'Jobs',
  kubernetes: 'Kubernetes',
  logs: 'Logs',
  namespaces: 'Namespaces',
  networks: 'Networks',
  new: 'New',
  newstack: 'New stack',
  notifications: 'Notifications',
  registries: 'Registries',
  roles: 'Roles',
  secrets: 'Secrets',
  services: 'Services',
  settings: 'Settings',
  sources: 'Sources',
  stacks: 'Stacks',
  stats: 'Statistics',
  tags: 'Tags',
  teams: 'Teams',
  templates: 'Templates',
  users: 'Users',
  volumes: 'Volumes',
  workflows: 'Workflows',
};

export function buildHeaderBreadcrumbs(
  pathname: string,
  environmentName?: string,
  segmentOverrides: Record<string, string> = {}
): HeaderBreadcrumb[] {
  const parts = pathname.split('/').filter(Boolean).map(decodeSegment);

  if (!parts.length) {
    return [{ label: 'Environments' }];
  }

  if (/^\d+$/.test(parts[0])) {
    return buildEnvironmentBreadcrumbs(
      parts,
      environmentName,
      segmentOverrides
    );
  }

  return parts.map((part, index) => ({
    label: segmentOverrides[part] || getSegmentLabel(part),
    href:
      index === parts.length - 1
        ? undefined
        : `/${parts.slice(0, index + 1).join('/')}`,
  }));
}

function buildEnvironmentBreadcrumbs(
  parts: string[],
  environmentName: string | undefined,
  segmentOverrides: Record<string, string>
): HeaderBreadcrumb[] {
  const [environmentId, platform, ...routeParts] = parts;
  const breadcrumbs: HeaderBreadcrumb[] = [
    { label: 'Environments', href: '/environments' },
    {
      label: environmentName || `Environment ${environmentId}`,
      href: `/environments/${environmentId}`,
    },
  ];

  if (platform) {
    breadcrumbs.push({
      label: getSegmentLabel(platform),
      href: routeParts.length ? `/${environmentId}/${platform}` : undefined,
    });
  }

  routeParts.forEach((part, index) => {
    breadcrumbs.push({
      label: segmentOverrides[part] || getSegmentLabel(part),
      href:
        index === routeParts.length - 1
          ? undefined
          : `/${[environmentId, platform, ...routeParts.slice(0, index + 1)].join('/')}`,
    });
  });

  return breadcrumbs;
}

export function getContainerIdFromPathname(pathname: string) {
  const match = pathname.match(/^\/[^/]+\/docker\/containers\/([^/]+)(?:\/|$)/);

  return match ? decodeSegment(match[1]) : undefined;
}

function getSegmentLabel(segment: string) {
  return (
    segmentLabels[segment.toLowerCase()] ||
    segment
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (character) => character.toUpperCase())
  );
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
