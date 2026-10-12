export type ConsoleRoute = {
  title: string;
  description: string;
};

export const consoleRoutes: Record<string, ConsoleRoute> = {
  workflows: {
    title: 'Workflows',
    description: 'Deploy and manage GitOps workflows.',
  },
  sources: {
    title: 'Sources',
    description: 'Manage repositories and deployment sources.',
  },
  users: {
    title: 'User-related',
    description: 'Manage users, teams, and access.',
  },
  teams: {
    title: 'Teams',
    description: 'Manage teams and team membership.',
  },
  roles: {
    title: 'Roles',
    description: 'Manage access-control roles.',
  },
  environments: {
    title: 'Environments',
    description: 'Manage Docker, Kubernetes, and Edge environments.',
  },
  groups: {
    title: 'Environment groups',
    description: 'Organize environments into groups.',
  },
  tags: {
    title: 'Tags',
    description: 'Manage environment tags.',
  },
  registries: {
    title: 'Registries',
    description: 'Configure container image registries.',
  },
  'activity-logs': {
    title: 'Activity logs',
    description: 'Review administrative activity and audit events.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Review system notifications.',
  },
  settings: {
    title: 'Settings',
    description: 'Configure Vessel HQ.',
  },
};

export function resolveConsoleRoute(parts: string[]): ConsoleRoute | undefined {
  const base = consoleRoutes[parts[0]];
  if (!base) return undefined;

  if (parts[0] === 'environments' && parts[1] === 'new') {
    return {
      title: 'Add environment',
      description: 'Connect a new environment to Vessel HQ.',
    };
  }

  if (parts[0] === 'environments' && /^\d+$/.test(parts[1] || '')) {
    return {
      title: 'Environment',
      description: `Manage environment ${parts[1]}.`,
    };
  }

  if (parts[0] === 'settings' && parts[1] === 'authentication') {
    return {
      title: 'Authentication',
      description: 'Configure authentication and identity providers.',
    };
  }

  if (parts[0] === 'settings' && parts[1] === 'edge-compute') {
    return {
      title: 'Edge Compute',
      description: 'Configure Edge Compute features.',
    };
  }

  return parts.length === 1 ? base : undefined;
}
