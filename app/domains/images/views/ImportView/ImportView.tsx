import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';
import { Upload } from 'lucide-react';

import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import { tagImage, uploadImages } from '@/domains/images/services/imageService';
import {
  buildImageFullURI,
  fullURIIntoRepoAndTag,
} from '@/domains/images/mappers/image';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { withError } from '@/core/query';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { getDefaultImageConfig } from '@@/ImageConfigFieldset/getImageConfig';
import { ImageConfigFieldset, ImageConfigValues } from '@@/ImageConfigFieldset';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

import { queryKeys } from '../../queries/queryKeys';

interface UploadResponse {
  error?: string;
  stream?: string;
}

export function ImportView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSwarmAgent = useIsSwarmAgent();
  const registriesQuery = useEnvironmentRegistries(environmentId);
  const [file, setFile] = useState<File>();
  const [nodeName, setNodeName] = useState('');
  const [imageConfig, setImageConfig] = useState<ImageConfigValues>(() =>
    getDefaultImageConfig()
  );
  const uploadMutation = useMutation(handleUpload, {
    ...withError('Unable to upload image'),
    onSuccess: () =>
      queryClient.invalidateQueries(queryKeys.base(environmentId)),
  });

  return (
    <>
      <PageHeader
        title="Import image"
        breadcrumbs={[
          { label: 'Images', link: 'docker.images' },
          'Import image',
        ]}
      />
      <Widget>
        <WidgetBody>
          <form
            className="form-horizontal"
            onSubmit={(event) => {
              event.preventDefault();
              uploadMutation.mutate();
            }}
          >
            <FormSection title="Upload">
              <TextTip>You can upload a tar archive containing images.</TextTip>
              <div className="form-group">
                <div className="col-sm-12 flex items-center gap-2">
                  <Button
                    type="button"
                    color="primary"
                    size="small"
                    icon={Upload}
                    as="label"
                    data-cy="image-import-select-file"
                  >
                    Select file
                    <input
                      type="file"
                      className="hidden"
                      accept=".tar,application/x-tar,application/octet-stream"
                      onChange={(event) => setFile(event.target.files?.[0])}
                    />
                  </Button>
                  <span>{file?.name || 'No file selected'}</span>
                </div>
              </div>
            </FormSection>

            {isSwarmAgent && (
              <FormSection title="Deployment">
                <NodeSelector value={nodeName} onChange={setNodeName} />
              </FormSection>
            )}

            <Authorized authorizations="DockerImageCreate">
              <Widget>
                <WidgetTitle title="Tag the image" icon="tag" />
                <WidgetBody>
                  <ImageConfigFieldset
                    values={imageConfig}
                    setFieldValue={(field, value) =>
                      setImageConfig((current) => ({
                        ...current,
                        [field]: value,
                      }))
                    }
                  />
                </WidgetBody>
              </Widget>
            </Authorized>

            <FormSection title="Actions">
              <LoadingButton
                loadingText="Images uploading in progress..."
                isLoading={uploadMutation.isLoading}
                disabled={!file}
                className="!ml-0"
                data-cy="image-import-upload"
              >
                Upload
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  async function handleUpload() {
    if (!file) {
      return;
    }

    const { data } = await uploadImages(environmentId, file, { nodeName });
    const result = data as UploadResponse;
    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.stream) {
      notifySuccess(
        'Success',
        'The uploaded archive contained multiple images. The provided tag was ignored.'
      );
      return;
    }

    const match = /Loaded.*?: (.*?)(?:\n|$)/.exec(result.stream);
    const imageId = match?.[1];
    if (imageId && imageConfig.image) {
      const registry = imageConfig.registryId
        ? registriesQuery.data?.find(
            (item) => item.Id === imageConfig.registryId
          )
        : undefined;
      const { repo, tag } = fullURIIntoRepoAndTag(
        buildImageFullURI(imageConfig.image, registry)
      );
      try {
        await tagImage(environmentId, imageId, repo, tag);
      } catch (error) {
        notifyError('Failure', error as Error, 'Unable to tag image');
      }
    }

    notifySuccess('Success', 'Images successfully uploaded');
    if (imageId) {
      router.stateService.go('docker.images.image', { id: imageId });
    }
  }
}
