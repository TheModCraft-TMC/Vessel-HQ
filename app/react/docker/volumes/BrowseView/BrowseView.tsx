import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { saveAs } from 'file-saver';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { FileData } from '@/react/docker/components/FilesTable/types';
import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { withError } from '@/react-tools/react-query';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { AgentVolumeBrowser } from './AgentVolumeBrowser';

export function BrowseView() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const {
    params: { id: volumeId, nodeName },
  } = useCurrentStateAndParams();
  const [path, setPath] = useState('/');
  const apiVersionQuery = useApiVersion(environmentId);
  const apiVersion = apiVersionQuery.data || 1;
  const queryKey = [
    'environment',
    environmentId,
    'volume-browser',
    volumeId,
    path,
  ] as const;
  const filesQuery = useQuery(
    queryKey,
    () => listFiles(environmentId, apiVersion, volumeId, path, nodeName),
    {
      ...withError('Unable to browse volume'),
      enabled: apiVersionQuery.isSuccess,
    }
  );
  const renameMutation = useMutation(
    ({ currentPath, newPath }: { currentPath: string; newPath: string }) =>
      renameFile(
        environmentId,
        apiVersion,
        volumeId,
        currentPath,
        newPath,
        nodeName
      ),
    withError('Unable to rename file')
  );
  const deleteMutation = useMutation(
    (filePath: string) =>
      deleteFile(environmentId, apiVersion, volumeId, filePath, nodeName),
    withError('Unable to delete file')
  );
  const uploadMutation = useMutation(
    (file: File) =>
      uploadFile(environmentId, apiVersion, volumeId, path, file, nodeName),
    {
      ...withError('Unable to upload file'),
      onSuccess: () => queryClient.invalidateQueries(queryKey),
    }
  );

  return (
    <>
      <PageHeader
        title="Volume browser"
        breadcrumbs={[
          { label: 'Volumes', link: 'docker.volumes' },
          {
            label: volumeId,
            link: 'docker.volumes.volume',
            linkParams: { id: volumeId, nodeName },
          },
          'Browse',
        ]}
      />
      {filesQuery.data && (
        <AgentVolumeBrowser
          dataset={filesQuery.data}
          relativePath={path}
          isRoot={path === '/'}
          isUploadAllowed={apiVersion > 1}
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
        onSuccess: () => notifySuccess('File successfully renamed', newPath),
      }
    );
    await refresh();
  }

  async function handleDownload(file: string) {
    const filePath = buildPath(path, file);
    try {
      const data = await getFile(
        environmentId,
        apiVersion,
        volumeId,
        filePath,
        nodeName
      );
      saveAs(new Blob([data]), file);
    } catch (error) {
      notifyError('Failure', error as Error, 'Unable to download file');
    }
  }

  async function handleDelete(file: string) {
    const filePath = buildPath(path, file);
    if (
      !(await confirmDelete(`Are you sure you want to delete ${filePath}?`))
    ) {
      return;
    }
    await deleteMutation.mutateAsync(filePath, {
      onSuccess: () => notifySuccess('File successfully deleted', filePath),
    });
    await refresh();
  }
}

function buildPath(parent: string, name: string) {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

function parentPath(path: string) {
  const separator = path.lastIndexOf('/');
  return separator <= 0 ? '/' : path.slice(0, separator);
}

function buildBrowseUrl(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  action: string
) {
  return apiVersion > 1
    ? `/endpoints/${environmentId}/docker/v${apiVersion}/browse/${action}`
    : `/endpoints/${environmentId}/docker/browse/${encodeURIComponent(
        volumeId
      )}/${action}`;
}

function requestConfig(
  apiVersion: number,
  volumeId: string,
  path: string | undefined,
  nodeName: string | undefined
) {
  return {
    params: {
      ...(apiVersion > 1 ? { volumeID: volumeId } : {}),
      ...(path ? { path } : {}),
    },
    headers: { ...withAgentTargetHeader(nodeName) },
  };
}

async function listFiles(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  path: string,
  nodeName?: string
) {
  try {
    const { data } = await axios.get<FileData[]>(
      buildBrowseUrl(environmentId, apiVersion, volumeId, 'ls'),
      requestConfig(apiVersion, volumeId, path, nodeName)
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to browse volume');
  }
}

async function getFile(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  path: string,
  nodeName?: string
) {
  try {
    const { data } = await axios.get<ArrayBuffer>(
      buildBrowseUrl(environmentId, apiVersion, volumeId, 'get'),
      {
        ...requestConfig(apiVersion, volumeId, path, nodeName),
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
  volumeId: string,
  currentPath: string,
  newPath: string,
  nodeName?: string
) {
  try {
    await axios.put(
      buildBrowseUrl(environmentId, apiVersion, volumeId, 'rename'),
      { CurrentFilePath: currentPath, NewFilePath: newPath },
      requestConfig(apiVersion, volumeId, undefined, nodeName)
    );
  } catch (error) {
    throw parseAxiosError(error, 'Unable to rename file');
  }
}

async function deleteFile(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  path: string,
  nodeName?: string
) {
  try {
    await axios.delete(
      buildBrowseUrl(environmentId, apiVersion, volumeId, 'delete'),
      requestConfig(apiVersion, volumeId, path, nodeName)
    );
  } catch (error) {
    throw parseAxiosError(error, 'Unable to delete file');
  }
}

async function uploadFile(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  path: string,
  file: File,
  nodeName?: string
) {
  if (apiVersion < 2) {
    throw new Error('Upload is not supported by this agent version');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('Path', path);

  try {
    await axios.post(
      `/endpoints/${environmentId}/docker/v${apiVersion}/browse/put`,
      formData,
      {
        params: { volumeID: volumeId },
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
