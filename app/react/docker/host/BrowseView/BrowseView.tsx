import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';
import { FileData } from '@/react/docker/components/FilesTable/types';
import { getNode } from '@/react/docker/proxy/queries/nodes/useNode';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { withError } from '@/core/query/query-client';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { AgentHostBrowser } from './AgentHostBrowser';

const ROOT_PATH = '/host';

export function HostBrowseView() {
  return <BrowseView mode="host" />;
}

export function NodeBrowseView() {
  return <BrowseView mode="node" />;
}

function BrowseView({ mode }: { mode: 'host' | 'node' }) {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const {
    params: { id: nodeId },
  } = useCurrentStateAndParams();
  const [path, setPath] = useState(ROOT_PATH);
  const apiVersionQuery = useApiVersion(environmentId);
  const nodeQuery = useQuery(
    ['environment', environmentId, 'docker', 'nodes', nodeId],
    () => getNode(environmentId, nodeId),
    {
      ...withError('Unable to retrieve host information'),
      enabled: mode === 'node' && Boolean(nodeId),
    }
  );
  const nodeName = mode === 'node' ? nodeQuery.data?.Description?.Hostname : '';
  const apiVersion = apiVersionQuery.data || 1;
  const queryKey = [
    'environment',
    environmentId,
    'host-browser',
    nodeName,
    path,
  ] as const;
  const canBrowse =
    apiVersionQuery.isSuccess &&
    apiVersion >= 2 &&
    (mode === 'host' || Boolean(nodeName));
  const filesQuery = useQuery(
    queryKey,
    () => listFiles(environmentId, apiVersion, path, nodeName),
    {
      ...withError('Unable to browse host'),
      enabled: canBrowse,
    }
  );
  const renameMutation = useMutation(
    ({ currentPath, newPath }: { currentPath: string; newPath: string }) =>
      renameFile(environmentId, apiVersion, currentPath, newPath, nodeName),
    withError('Unable to rename file')
  );
  const deleteMutation = useMutation(
    (filePath: string) =>
      deleteFile(environmentId, apiVersion, filePath, nodeName),
    withError('Unable to delete file')
  );
  const uploadMutation = useMutation(
    (file: File) => uploadFile(environmentId, apiVersion, path, file, nodeName),
    {
      ...withError('Unable to upload file'),
      onSuccess: () => queryClient.invalidateQueries(queryKey),
    }
  );

  const title = mode === 'node' ? 'Node browser' : 'Host browser';
  const breadcrumbs =
    mode === 'node'
      ? [
          { label: 'Swarm', link: 'docker.swarm' },
          {
            label: nodeName || nodeId,
            link: 'docker.nodes.node',
            linkParams: { id: nodeId },
          },
          'Browse',
        ]
      : [
          {
            label: 'Host',
            link: 'docker.host',
          },
          'Browse',
        ];

  return (
    <>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      {filesQuery.data && (
        <AgentHostBrowser
          dataset={filesQuery.data}
          relativePath={relativePath(path)}
          isRoot={path === ROOT_PATH}
          onGoToParent={() => setPath(parentPath(path))}
          onBrowse={(folder) => setPath(buildPath(path, folder))}
          onRename={handleRename}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onFileSelectedForUpload={(file) => uploadMutation.mutate(file)}
        />
      )}
    </>
  );

  async function refresh() {
    await queryClient.invalidateQueries(queryKey);
  }

  async function handleRename(file: string, newName: string) {
    const currentPath = buildPath(path, file);
    const newPath = buildPath(path, newName);
    await renameMutation.mutateAsync(
      { currentPath, newPath },
      {
        onSuccess: () =>
          notifySuccess('File successfully renamed', relativePath(newPath)),
      }
    );
    await refresh();
  }

  async function handleDownload(file: string) {
    const filePath = buildPath(path, file);
    try {
      const data = await getFile(environmentId, apiVersion, filePath, nodeName);
      saveAs(new Blob([data]), file);
    } catch (error) {
      notifyError('Failure', error as Error, 'Unable to download file');
    }
  }

  async function handleDelete(file: string) {
    const filePath = buildPath(path, file);
    if (
      !(await confirmDelete(
        `Are you sure you want to delete ${relativePath(filePath)}?`
      ))
    ) {
      return;
    }
    await deleteMutation.mutateAsync(filePath, {
      onSuccess: () =>
        notifySuccess('File successfully deleted', relativePath(filePath)),
    });
    await refresh();
  }
}

function relativePath(path: string) {
  return path.replace(/^\/host\/?/, '/');
}

function buildPath(parent: string, name: string) {
  return parent.endsWith('/') ? `${parent}${name}` : `${parent}/${name}`;
}

function parentPath(path: string) {
  if (path === ROOT_PATH) {
    return ROOT_PATH;
  }
  const separator = path.lastIndexOf('/');
  return separator <= ROOT_PATH.length ? ROOT_PATH : path.slice(0, separator);
}

function buildBrowseUrl(
  environmentId: number,
  apiVersion: number,
  action: string
) {
  return `/endpoints/${environmentId}/docker/v${apiVersion}/browse/${action}`;
}

function requestConfig(path: string | undefined, nodeName: string | undefined) {
  return {
    params: path ? { path } : undefined,
    headers: { ...withAgentTargetHeader(nodeName) },
  };
}

async function listFiles(
  environmentId: number,
  apiVersion: number,
  path: string,
  nodeName?: string
) {
  try {
    const { data } = await axios.get<FileData[]>(
      buildBrowseUrl(environmentId, apiVersion, 'ls'),
      requestConfig(path, nodeName)
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to browse host');
  }
}

async function getFile(
  environmentId: number,
  apiVersion: number,
  path: string,
  nodeName?: string
) {
  try {
    const { data } = await axios.get<ArrayBuffer>(
      buildBrowseUrl(environmentId, apiVersion, 'get'),
      {
        ...requestConfig(path, nodeName),
        responseType: 'arraybuffer',
      }
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to download file');
  }
}

async function renameFile(
  environmentId: number,
  apiVersion: number,
  currentPath: string,
  newPath: string,
  nodeName?: string
) {
  try {
    await axios.put(
      buildBrowseUrl(environmentId, apiVersion, 'rename'),
      { CurrentFilePath: currentPath, NewFilePath: newPath },
      requestConfig(undefined, nodeName)
    );
  } catch (error) {
    throw parseAxiosError(error, 'Unable to rename file');
  }
}

async function deleteFile(
  environmentId: number,
  apiVersion: number,
  path: string,
  nodeName?: string
) {
  try {
    await axios.delete(buildBrowseUrl(environmentId, apiVersion, 'delete'), {
      ...requestConfig(path, nodeName),
    });
  } catch (error) {
    throw parseAxiosError(error, 'Unable to delete file');
  }
}

async function uploadFile(
  environmentId: number,
  apiVersion: number,
  path: string,
  file: File,
  nodeName?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('Path', path);

  try {
    await axios.post(
      buildBrowseUrl(environmentId, apiVersion, 'put'),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
    notifySuccess('Success', 'File successfully uploaded');
  } catch (error) {
    throw parseAxiosError(error, 'Unable to upload file');
  }
}
