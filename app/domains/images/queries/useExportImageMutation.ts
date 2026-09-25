import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';

import { EnvironmentId } from '@/domains/environments';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { dockerClient } from '@/core/composition/dockerClient';

export function useExportMutation() {
  const environmentId = useEnvironmentId();
  return useMutation({
    mutationFn: (
      args: Omit<Parameters<typeof exportImage>[0], 'environmentId'>
    ) => exportImage({ ...args, environmentId }),
  });
}

export async function exportImage({
  environmentId,
  nodeName,
  images,
}: {
  environmentId: EnvironmentId;
  nodeName?: string;
  images: Array<{ tags?: Array<string>; id: string }>;
}) {
  const { names } = getImagesNamesForDownload(images);

  const { headers: responseHeaders, data } = await dockerClient.downloadImages(
    environmentId,
    names,
    { nodeName }
  );
  const contentDispositionHeader =
    responseHeaders?.['content-disposition'] || '';
  const filename = contentDispositionHeader
    .replace('attachment; filename=', '')
    .trim();
  saveAs(data as Blob, filename);
}

export function getImagesNamesForDownload(
  images: Array<{ tags?: Array<string>; id: string }>
) {
  const names = images.map((image) =>
    image.tags?.length && image.tags[0] !== '<none>:<none>'
      ? image.tags[0]
      : image.id
  );
  return {
    names,
  };
}
