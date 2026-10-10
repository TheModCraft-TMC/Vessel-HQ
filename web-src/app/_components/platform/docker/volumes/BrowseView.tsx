import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { withError } from '@/core/query';
import { PageHeader } from '@/ui/layouts/view-layout';
import { confirmDelete } from '@/ui/components/dialog/confirm';
import { AgentVolumeBrowser } from '@/domains/volumes/components/VolumeBrowser/AgentVolumeBrowser';
import {
  deleteFile,
  getFile,
  listFiles,
  renameFile,
  uploadFile,
} from '@/domains/volumes/services/browser.service';

export function BrowseView() {
  return (
    <>
      <PageHeader title="Volume browser" breadcrumbs="Volumes" />
      <VolumeBrowserContent />
    </>
  );
}

export function VolumeBrowserContent() {
  const environmentId = useEnvironmentId();
  const { id: volumeId, nodeName } = useRouteParams();
  const [path, setPath] = useState('/');
  const [files, setFiles] = useState<Awaited<ReturnType<typeof listFiles>>>();
  const [isLoading, setIsLoading] = useState(true);
  const apiVersionQuery = useApiVersion(environmentId);
  const apiVersion = apiVersionQuery.data || 1;

  useEffect(() => {
    if (!apiVersionQuery.isSuccess) return;
    let active = true;
    void listFiles(environmentId, apiVersion, volumeId, path, nodeName)
      .then((data) => active && setFiles(data))
      .catch(
        (error) =>
          active &&
          notifyError('Failure', error as Error, 'Unable to browse volume')
      )
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [
    apiVersion,
    apiVersionQuery.isSuccess,
    environmentId,
    nodeName,
    path,
    volumeId,
  ]);

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
      onSuccess: async () => {
        notifySuccess('Success', 'File successfully uploaded');
        await refresh();
      },
    }
  );

  return (
    <>
      {!isLoading && files && (
        <AgentVolumeBrowser
          dataset={files}
          relativePath={path}
          isRoot={path === '/'}
          isUploadAllowed={apiVersion > 1}
          onGoToParent={() => navigate(parentPath(path))}
          onBrowse={(folder) => navigate(buildPath(path, folder))}
          onRename={handleRename}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onFileSelectedForUpload={(file) => uploadMutation.mutate(file)}
        />
      )}
    </>
  );

  async function refresh() {
    setIsLoading(true);
    try {
      setFiles(
        await listFiles(environmentId, apiVersion, volumeId, path, nodeName)
      );
    } finally {
      setIsLoading(false);
    }
  }

  function navigate(nextPath: string) {
    setFiles(undefined);
    setIsLoading(true);
    setPath(nextPath);
  }

  async function handleRename(file: string, newName: string) {
    const currentPath = buildPath(path, file);
    const newPath = buildPath(path, newName);
    await renameMutation.mutateAsync({ currentPath, newPath });
    notifySuccess('File successfully renamed', newPath);
    await refresh();
  }

  async function handleDownload(file: string) {
    try {
      saveAs(
        new Blob([
          await getFile(
            environmentId,
            apiVersion,
            volumeId,
            buildPath(path, file),
            nodeName
          ),
        ]),
        file
      );
    } catch (error) {
      notifyError('Failure', error as Error, 'Unable to download file');
    }
  }

  async function handleDelete(file: string) {
    const filePath = buildPath(path, file);
    if (!(await confirmDelete(`Are you sure you want to delete ${filePath}?`)))
      return;
    await deleteMutation.mutateAsync(filePath);
    notifySuccess('File successfully deleted', filePath);
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
