import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { FileData } from '@/react/docker/components/FilesTable/types';
import { withAgentTargetHeader } from '@/react/docker/proxy/queries/utils';

function buildBrowseUrl(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  action: string
) {
  return apiVersion > 1
    ? `/endpoints/${environmentId}/docker/v${apiVersion}/browse/${action}`
    : `/endpoints/${environmentId}/docker/browse/${encodeURIComponent(volumeId)}/${action}`;
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

export async function listFiles(
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

export async function getFile(
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

export async function renameFile(
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

export async function deleteFile(
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

export async function uploadFile(
  environmentId: number,
  apiVersion: number,
  volumeId: string,
  path: string,
  file: File,
  nodeName?: string
) {
  if (apiVersion < 2)
    throw new Error('Upload is not supported by this agent version');
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
  } catch (error) {
    throw parseAxiosError(error, 'Unable to upload file');
  }
}
