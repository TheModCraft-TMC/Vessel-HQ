import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { Download, List, Tag, Trash2, Upload } from 'lucide-react';
import { saveAs } from 'file-saver';

import { ImageDetailsViewModel } from '@/docker/models/imageDetails';
import { ImageLayerViewModel } from '@/docker/models/imageLayer';
import { humanize, isoDate } from '@/portainer/filters/filters';
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from '@/portainer/services/notifications';
import { pullImage } from '@/react/docker/images/queries/usePullImageMutation';
import { pushImage } from '@/react/docker/images/queries/usePushImageMutation';
import { queryKeys } from '@/react/docker/images/queries/queryKeys';
import {
  buildImageFullURI,
  fullURIIntoRepoAndTag,
} from '@/react/docker/images/utils';
import { downloadImages } from '@/react/docker/proxy/queries/images/useDownloadImages';
import { getImage } from '@/react/docker/proxy/queries/images/useImage';
import { getImageHistory } from '@/react/docker/proxy/queries/images/useImageHistory';
import { deleteImage } from '@/react/docker/images/queries/useDeleteImageMutation';
import { tagImage } from '@/react/docker/proxy/queries/images/useTagImageMutation';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/react/portainer/registries/types/registry';
import { withError } from '@/core/query/query-client';

import { Button, LoadingButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { DetailsTable } from '@@/DetailsTable';
import { ImageConfigFieldset, ImageConfigValues } from '@@/ImageConfigFieldset';
import { findBestMatchRegistry } from '@@/ImageConfigFieldset/findRegistryMatch';
import {
  getDefaultImageConfig,
  getImageConfig,
} from '@@/ImageConfigFieldset/getImageConfig';
import { Link } from '@@/Link';
import { PageHeader } from '@@/PageHeader';
import { TableContainer, TableTitle } from '@@/datatables';
import { confirmDelete } from '@@/modals/confirm';
import { TextTip } from '@@/Tip/TextTip';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

import { confirmImageExport } from '../common/ConfirmExportModal';

import { DockerfileDetails } from './DockerfileDetails';
import { selectRegistry } from './RegistrySelectPrompt';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    params: { id: imageId, nodeName },
  } = useCurrentStateAndParams();
  const registriesQuery = useEnvironmentRegistries(environmentId);
  const itemQueryKey = [
    ...queryKeys.base(environmentId),
    imageId,
    nodeName,
  ] as const;
  const imageQuery = useQuery(
    itemQueryKey,
    async () =>
      new ImageDetailsViewModel(
        await getImage(environmentId, imageId, { nodeName })
      ),
    withError('Unable to retrieve image details')
  );
  const historyQuery = useQuery(
    [...itemQueryKey, 'history'],
    async () =>
      (await getImageHistory(environmentId, imageId, { nodeName }))
        .reverse()
        .map((layer, index) => new ImageLayerViewModel(index, layer)),
    withError('Unable to retrieve image layers')
  );
  const [imageConfig, setImageConfig] = useState<ImageConfigValues>(() =>
    getDefaultImageConfig()
  );
  const tagMutation = useMutation(handleTag, withError('Unable to tag image'));
  const removeMutation = useMutation(
    (target: string) =>
      deleteImage({ environmentId, imageId: target, nodeName, force: false }),
    withError('Unable to remove image')
  );
  const exportMutation = useMutation(
    handleExport,
    withError('Unable to download image')
  );

  if (!imageQuery.data) {
    return null;
  }

  const image = imageQuery.data;
  const resolvedImageId = image.Id || imageId;
  const tags = image.RepoTags || [];

  return (
    <>
      <PageHeader
        title="Image details"
        breadcrumbs={[
          { label: 'Images', link: 'docker.images' },
          resolvedImageId,
        ]}
        reload
      />

      {tags.length > 0 && (
        <TableContainer>
          <TableTitle label="Image tags" icon={Tag} />
          <div className="flex flex-wrap gap-2 p-4">
            {tags.map((tagValue) => (
              <div className="input-group" key={tagValue}>
                <span
                  className="input-group-addon"
                  data-cy={`image-tag-${tagValue}`}
                >
                  {tagValue}
                </span>
                <span className="input-group-btn inline-flex">
                  <Authorized authorizations="DockerImagePush">
                    <Button
                      color="primary"
                      icon={Upload}
                      title="Push to registry"
                      onClick={() => handleRegistryAction(tagValue, 'push')}
                      data-cy={`image-push-${tagValue}`}
                    />
                  </Authorized>
                  <Authorized authorizations="DockerImageCreate">
                    <Button
                      color="primary"
                      icon={Download}
                      title="Pull from registry"
                      onClick={() => handleRegistryAction(tagValue, 'pull')}
                      data-cy={`image-pull-${tagValue}`}
                    />
                  </Authorized>
                  <Authorized authorizations="DockerImageDelete">
                    <Button
                      color="danger"
                      icon={Trash2}
                      title="Remove tag"
                      onClick={() => handleRemoveTag(tagValue)}
                      data-cy={`image-remove-${tagValue}`}
                    />
                  </Authorized>
                </span>
              </div>
            ))}
          </div>
        </TableContainer>
      )}

      <Authorized authorizations="DockerImageCreate">
        <Widget>
          <WidgetTitle title="Tag the image" icon="tag" />
          <WidgetBody>
            <form
              className="form-horizontal"
              onSubmit={(event) => {
                event.preventDefault();
                tagMutation.mutate();
              }}
            >
              <ImageConfigFieldset
                values={imageConfig}
                setFieldValue={(field, value) =>
                  setImageConfig((current) => ({
                    ...current,
                    [field]: value,
                  }))
                }
              />
              <TextTip>
                If you do not specify a tag, <code>latest</code> is used.
              </TextTip>
              <Button
                color="primary"
                size="small"
                disabled={!imageConfig.image || tagMutation.isLoading}
                data-cy="image-tag-submit"
              >
                Tag
              </Button>
            </form>
          </WidgetBody>
        </Widget>
      </Authorized>

      <TableContainer>
        <TableTitle label="Image details" icon={List} />
        <DetailsTable dataCy="image-details-table">
          <DetailsTable.Row label="ID">
            {image.Id}
            <span className="ml-2 inline-flex gap-2">
              <Authorized authorizations="DockerImageDelete">
                <DeleteButton
                  size="xsmall"
                  onConfirmed={handleRemoveImage}
                  confirmMessage="Deleting this image also deletes all associated tags. Delete it?"
                  data-cy="image-delete"
                >
                  Delete this image
                </DeleteButton>
              </Authorized>
              <Authorized authorizations="DockerImageGet">
                <LoadingButton
                  size="xsmall"
                  icon={Download}
                  isLoading={exportMutation.isLoading}
                  loadingText="Export in progress..."
                  onClick={() => exportMutation.mutate()}
                  data-cy="image-export"
                >
                  Export this image
                </LoadingButton>
              </Authorized>
            </span>
          </DetailsTable.Row>
          {image.Parent && (
            <DetailsTable.Row label="Parent">
              <Link
                to="docker.images.image"
                params={{ id: image.Parent, nodeName }}
                data-cy="image-parent"
              >
                {image.Parent}
              </Link>
            </DetailsTable.Row>
          )}
          <DetailsTable.Row label="Size">
            {humanize(image.Size)}
          </DetailsTable.Row>
          <DetailsTable.Row label="Created">
            {isoDate(image.Created)}
          </DetailsTable.Row>
          <DetailsTable.Row label="Build">
            Docker {image.DockerVersion} on {image.Os}, {image.Architecture}
          </DetailsTable.Row>
          {image.Labels && Object.keys(image.Labels).length > 0 && (
            <DetailsTable.Row label="Labels">
              <KeyValueTable values={image.Labels} />
            </DetailsTable.Row>
          )}
          {image.Author && (
            <DetailsTable.Row label="Author">{image.Author}</DetailsTable.Row>
          )}
        </DetailsTable>
      </TableContainer>

      <DockerfileDetails
        image={{
          Command: image.Command || null,
          Entrypoint: image.Entrypoint || [],
          ExposedPorts: (image.ExposedPorts || []) as unknown as number[],
          Volumes: (image.Volumes || []) as unknown as string[],
          Env: image.Env || [],
        }}
      />
      {historyQuery.data && historyQuery.data.length > 0 && (
        <LayersTable layers={historyQuery.data} />
      )}
    </>
  );

  async function invalidate() {
    await queryClient.invalidateQueries(queryKeys.base(environmentId));
  }

  async function handleTag() {
    const registry = getSelectedRegistry(
      registriesQuery.data || [],
      imageConfig
    );
    const { repo, tag } = fullURIIntoRepoAndTag(
      buildImageFullURI(imageConfig.image, registry)
    );
    await tagImage(environmentId, imageId, repo, tag, { nodeName });
    await invalidate();
    notifySuccess('Success', 'Image successfully tagged');
  }

  async function handleRegistryAction(
    repository: string,
    action: 'push' | 'pull'
  ) {
    try {
      const registries = registriesQuery.data || [];
      const matched = findBestMatchRegistry(repository, registries);
      const registryId = registries.length
        ? await selectRegistry(registries, matched?.Id || registries[0].Id)
        : undefined;
      if (registries.length && registryId === undefined) {
        return;
      }
      const config = getImageConfig(repository, registries, registryId);
      const registry = getSelectedRegistry(registries, config);
      if (action === 'push') {
        await pushImage({
          environmentId,
          image: config.image,
          registry,
          nodeName,
        });
        notifySuccess('Image successfully pushed', repository);
      } else {
        await pullImage({
          environmentId,
          image: config.image,
          registry,
          nodeName,
          ignoreErrors: false,
        });
        notifySuccess('Image successfully pulled', repository);
      }
      await invalidate();
    } catch (error) {
      notifyError(
        'Failure',
        error as Error,
        `Unable to ${action} image ${action === 'push' ? 'to' : 'from'} repository`
      );
    }
  }

  async function handleRemoveTag(repository: string) {
    if (!(await confirmDelete('Are you sure you want to delete this tag?'))) {
      return;
    }
    await removeMutation.mutateAsync(repository);
    notifySuccess(
      tags.length === 1
        ? 'Image successfully deleted'
        : 'Tag successfully deleted',
      repository
    );
    if (tags.length === 1) {
      router.stateService.go('docker.images');
    } else {
      await invalidate();
    }
  }

  function handleRemoveImage() {
    removeMutation.mutate(resolvedImageId, {
      onSuccess: () => {
        notifySuccess('Image successfully deleted', resolvedImageId);
        router.stateService.go('docker.images');
      },
    });
  }

  async function handleExport() {
    if (!tags.length || tags.includes('<none>')) {
      notifyWarning('', 'Cannot download an untagged image');
      return;
    }
    if (!(await confirmImageExport())) {
      return;
    }
    const data = await downloadImages(
      environmentId,
      [{ tags, id: resolvedImageId }],
      { nodeName }
    );
    saveAs(new Blob([data], { type: 'application/x-tar' }), 'images.tar');
    notifySuccess('Success', 'Image successfully downloaded');
  }
}

function getSelectedRegistry(
  registries: Registry[],
  config: ImageConfigValues
) {
  return config.useRegistry && config.registryId
    ? registries.find((registry) => registry.Id === config.registryId)
    : undefined;
}

function KeyValueTable({ values }: { values: Record<string, string> }) {
  return (
    <table className="table-bordered table-condensed table">
      <tbody>
        {Object.entries(values).map(([key, value]) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LayersTable({ layers }: { layers: ImageLayerViewModel[] }) {
  const [sort, setSort] = useState<'Order' | 'Size'>('Order');
  const [descending, setDescending] = useState(false);
  const sortedLayers = useMemo(
    () =>
      [...layers].sort((a, b) => {
        const result = a[sort] - b[sort];
        return descending ? -result : result;
      }),
    [descending, layers, sort]
  );

  return (
    <TableContainer>
      <TableTitle label="Image layers" icon={List} />
      <table className="table">
        <thead>
          <tr>
            <th>
              <SortButton field="Order">Order</SortButton>
            </th>
            <th>
              <SortButton field="Size">Size</SortButton>
            </th>
            <th>Layer</th>
          </tr>
        </thead>
        <tbody>
          {sortedLayers.map((layer) => (
            <tr key={`${layer.Order}-${layer.Id}`}>
              <td>{layer.Order}</td>
              <td>{humanize(layer.Size)}</td>
              <td>
                <LayerCommand value={formatLayerCommand(layer.CreatedBy)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableContainer>
  );

  function SortButton({
    field,
    children,
  }: {
    field: 'Order' | 'Size';
    children: string;
  }) {
    return (
      <Button
        color="link"
        className="!p-0"
        onClick={() => {
          setDescending(sort === field ? !descending : false);
          setSort(field);
        }}
        data-cy={`image-layer-sort-${field}`}
      >
        {children}
      </Button>
    );
  }
}

function LayerCommand({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  if (value.length <= 130) {
    return <span>{value}</span>;
  }
  return (
    <span>
      {expanded ? value : `${value.slice(0, 130)}…`}
      <Button
        color="link"
        size="xsmall"
        onClick={() => setExpanded((current) => !current)}
        data-cy="image-layer-expand"
      >
        {expanded ? 'Show less' : 'Show more'}
      </Button>
    </span>
  );
}

function formatLayerCommand(value: string) {
  return (value || '')
    .replace('/bin/sh -c #(nop) ', '')
    .replace('/bin/sh -c ', 'RUN ');
}
