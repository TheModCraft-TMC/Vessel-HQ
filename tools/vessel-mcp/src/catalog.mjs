import { z } from 'zod';

const environment = z.object({ environmentId: z.number().int().positive() }).strict();
const fields = (value, names) => Object.fromEntries(names.filter((name) => value?.[name] !== undefined).map((name) => [name, value[name]]));
const array = (value) => {
  if (!Array.isArray(value)) throw new Error('Invalid API response');
  return value;
};

// Only explicit, read-only operations enter this catalog. Never expose a raw URL,
// arbitrary method, Docker inspect/env, logs, registry credentials or exec here.
export const catalog = [
  {
    name: 'environments.list',
    tags: ['environments'],
    description: 'List configured environments visible to the API identity.',
    schema: z.object({}).strict(),
    path: () => '/endpoints',
    project: (data, scope) =>
      array(data)
        .filter((e) => scope.has(e.Id))
        .map((e) => fields(e, ['Id', 'Name', 'Type', 'Status', 'GroupId'])),
  },
  ...[
    ['containers', '/containers/json?all=1', (data) => array(data).map((e) => fields(e, ['Id', 'Names', 'Image', 'State', 'Status', 'Created']))],
    ['images', '/images/json', (data) => array(data).map((e) => fields(e, ['Id', 'RepoTags', 'Created', 'Size']))],
    ['networks', '/networks', (data) => array(data).map((e) => fields(e, ['Id', 'Name', 'Driver', 'Scope', 'Internal']))],
    ['volumes', '/volumes', (data) => array(data.Volumes ?? []).map((e) => fields(e, ['Name', 'Driver', 'Scope', 'CreatedAt']))],
  ].map(([resource, suffix, project]) => ({
    name: `docker.${resource}.list`,
    tags: ['docker', resource],
    description: `List ${resource} in one configured Docker environment.`,
    schema: environment,
    path: ({ environmentId }) => `/endpoints/${environmentId}/docker${suffix}`,
    project,
  })),
  {
    name: 'stacks.list',
    tags: ['stacks'],
    description: 'List stack metadata in one configured environment; no environment variables or file contents.',
    schema: environment,
    path: () => '/stacks',
    project: (data, scope, args) =>
      array(data)
        .filter((e) => e.EndpointId === args.environmentId && scope.has(e.EndpointId))
        .map((e) => fields(e, ['Id', 'Name', 'Type', 'EndpointId', 'Status', 'CreationDate', 'UpdateDate'])),
  },
  {
    name: 'kubernetes.namespaces.list',
    tags: ['kubernetes', 'namespaces'],
    description: 'List namespace metadata in one configured Kubernetes environment.',
    schema: environment,
    path: ({ environmentId }) => `/endpoints/${environmentId}/kubernetes/api/v1/namespaces`,
    project: (data) => array(data.items).map((e) => ({ name: e.metadata?.name, uid: e.metadata?.uid, phase: e.status?.phase })),
  },
];

export function searchTools(query = '', tag, limit = 10) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return catalog
    .filter((tool) => (!tag || tool.tags.includes(tag)) && words.every((word) => `${tool.name} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase().includes(word)))
    .slice(0, Math.min(20, Math.max(1, limit)))
    .map(({ name, description, tags }) => ({ name, description, tags }));
}

export function getSchemas(names) {
  return names.map((name) => {
    const tool = catalog.find((entry) => entry.name === name);
    if (!tool) throw new Error('Unknown operation');
    return { name: tool.name, description: tool.description, inputSchema: z.toJSONSchema(tool.schema) };
  });
}

export function getTags() {
  return [...new Set(catalog.flatMap((tool) => tool.tags))].sort((a, b) => a.localeCompare(b));
}
