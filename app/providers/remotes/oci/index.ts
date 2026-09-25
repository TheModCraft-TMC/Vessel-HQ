import axios, { parseAxiosError } from '@/shared/http';

export type OciRegistryReference = {
  id: number;
  endpointId?: number;
};

export type OciManifestRequest = OciRegistryReference & {
  repository: string;
  tag: string;
};

export type OciTagRequest = OciRegistryReference & {
  repository: string;
  n?: number;
  last?: string;
};

export type RemoteRegistryCapabilities = {
  fixedUrl: boolean;
  supportsAuthentication: boolean;
  requiresRegion: boolean;
  supportsOrganization: boolean;
};

export type OciBlobRequest = OciRegistryReference & {
  repository: string;
  digest: string;
};

export type OciRepository = { name: string; tags?: string[] };

export interface OciRemoteProvider {
  capabilities: RemoteRegistryCapabilities;
  listCatalog(
    reference: OciRegistryReference
  ): Promise<{ repositories: string[] }>;
  listTags(request: OciTagRequest): Promise<{ name: string; tags: string[] }>;
  getManifestV1(request: OciManifestRequest): Promise<unknown>;
  getManifestV2(request: OciManifestRequest): Promise<unknown>;
  getBlob(request: OciBlobRequest): Promise<unknown>;
}

function url(id: number, suffix = '') {
  return `/registries/${id}/v2${suffix}`;
}

function requestParams(reference: OciRegistryReference) {
  return { endpointId: reference.endpointId };
}

async function get<T>(
  path: string,
  reference: OciRegistryReference,
  config: {
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
  } = {}
) {
  try {
    const { data } = await axios.get<T>(path, {
      ...config,
      params: { ...requestParams(reference), ...config.params },
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}

export const ociRemoteProvider: OciRemoteProvider = {
  capabilities: {
    fixedUrl: false,
    supportsAuthentication: true,
    requiresRegion: false,
    supportsOrganization: false,
  },
  listCatalog: (reference) => get(url(reference.id, '/_catalog'), reference),
  listTags: async ({ id, endpointId, repository, n, last }) => {
    const result = await get<{ name: string; tags?: string[] }>(
      url(id, `/${repository}/tags/list`),
      { id, endpointId },
      { params: { n, last } }
    );
    return { name: result.name, tags: result.tags || [] };
  },
  getManifestV1: (request) =>
    get(
      url(request.id, `/${request.repository}/manifests/${request.tag}`),
      request,
      {
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v1+json',
        },
      }
    ),
  getManifestV2: (request) =>
    get(
      url(request.id, `/${request.repository}/manifests/${request.tag}`),
      request,
      {
        headers: {
          Accept: 'application/vnd.docker.distribution.manifest.v2+json',
        },
      }
    ),
  getBlob: (request) =>
    get(
      url(request.id, `/${request.repository}/blobs/${request.digest}`),
      request
    ),
};

export type { OciRegistryReference as RegistryReference };
