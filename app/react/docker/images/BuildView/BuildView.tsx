import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Upload, Wrench } from 'lucide-react';

import { ImageBuildModel } from '@/docker/models/build';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import {
  buildImageFromDockerfileContent,
  buildImageFromDockerfileContentAndFiles,
  buildImageFromURL,
  buildImageFromUpload,
} from '@/react/docker/images/queries/useBuildImageMutation';
import { queryKeys } from '@/react/docker/images/queries/queryKeys';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { withError } from '@/react-tools/react-query';

import { BoxSelector } from '@@/BoxSelector';
import {
  editor,
  upload,
  url,
} from '@@/BoxSelector/common-options/build-methods';
import { Button, LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { PageHeader } from '@@/PageHeader';
import { Tabs } from '@@/primitives/Tabs/Tabs';
import { TextTip } from '@@/Tip/TextTip';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

type BuildMethod = 'editor' | 'upload' | 'url';

export function BuildView() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const isSwarmAgent = useIsSwarmAgent();
  const [activeTab, setActiveTab] = useState<'builder' | 'output'>('builder');
  const [method, setMethod] = useState<BuildMethod>('editor');
  const [names, setNames] = useState(['']);
  const [dockerfile, setDockerfile] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [uploadFile, setUploadFile] = useState<File>();
  const [remoteUrl, setRemoteUrl] = useState('');
  const [dockerfilePath, setDockerfilePath] = useState('Dockerfile');
  const [nodeName, setNodeName] = useState('');
  const [buildLogs, setBuildLogs] = useState<string[]>();
  const validNames = useMemo(() => validateNames(names), [names]);
  const buildMutation = useMutation(build, {
    ...withError('Unable to build image'),
    onSuccess: async (result) => {
      setBuildLogs(result.buildLogs);
      setActiveTab('output');
      if (result.hasError) {
        notifyError(
          'An error occurred during build',
          new Error('Please check the build log output.')
        );
      } else {
        notifySuccess('Success', 'Image successfully built');
        await queryClient.invalidateQueries(queryKeys.base(environmentId));
      }
    },
  });
  usePreventExit(
    '',
    dockerfile,
    method === 'editor' && !buildMutation.isSuccess
  );
  const canBuild =
    validNames &&
    ((method === 'editor' && Boolean(dockerfile)) ||
      (method === 'upload' && Boolean(uploadFile && dockerfilePath)) ||
      (method === 'url' && Boolean(remoteUrl && dockerfilePath)));

  return (
    <>
      <PageHeader
        title="Build image"
        breadcrumbs={[
          { label: 'Images', link: 'docker.images' },
          'Build image',
        ]}
      />
      <Widget>
        <WidgetBody>
          <Tabs.Container aria-label="Image build view" className="mb-4">
            <Tabs.Item
              isActive={activeTab === 'builder'}
              onClick={() => setActiveTab('builder')}
            >
              <Wrench className="lucide" aria-hidden="true" /> Builder
            </Tabs.Item>
            <Tabs.Item
              isActive={activeTab === 'output'}
              disabled={!buildLogs}
              onClick={() => setActiveTab('output')}
            >
              <FileText className="lucide" aria-hidden="true" /> Output
            </Tabs.Item>
          </Tabs.Container>

          {activeTab === 'builder' ? (
            <form
              className="form-horizontal"
              onSubmit={(event) => {
                event.preventDefault();
                buildMutation.mutate();
              }}
            >
              <FormSection title="Naming">
                <TextTip>You can specify multiple names for the image.</TextTip>
                <div className="form-group">
                  <div className="col-sm-12">
                    <Button
                      type="button"
                      color="secondary"
                      size="small"
                      icon={Plus}
                      onClick={() => setNames((current) => [...current, ''])}
                      data-cy="image-build-add-name"
                    >
                      Add additional name
                    </Button>
                  </div>
                </div>
                <TextTip>
                  Use <code>name:tag</code>, <code>repository/name:tag</code>,
                  or <code>registry:port/repository/name:tag</code>. The default
                  tag is <code>latest</code>.
                </TextTip>
                {names.map((name, index) => {
                  const state = validateName(name, names, index);
                  return (
                    <div
                      className="form-group"
                      key={`${index}-${names.length}`}
                    >
                      <div className="col-sm-12 flex items-center gap-2">
                        <Input
                          value={name}
                          onChange={(event) =>
                            setNames((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item
                              )
                            )
                          }
                          placeholder="e.g. my-image:my-tag"
                          data-cy="image-name-input"
                        />
                        <Button
                          type="button"
                          color="dangerlight"
                          icon={Trash2}
                          onClick={() =>
                            setNames((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                          data-cy={`image-build-remove-name-${index}`}
                        />
                      </div>
                      {!state.valid && (
                        <div className="col-sm-12 small text-warning">
                          {state.unique
                            ? 'Use 2–255 valid repository characters and an optional tag.'
                            : 'Image names must be unique.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </FormSection>

              <FormSection title="Build method">
                <BoxSelector<BuildMethod>
                  radioName="image-build-method"
                  value={method}
                  onChange={setMethod}
                  options={[editor, upload, url]}
                  slim
                />
              </FormSection>

              {method === 'editor' && (
                <>
                  <WebEditorForm
                    id="image-build-editor"
                    type="dockerfile"
                    value={dockerfile}
                    onChange={setDockerfile}
                    textTip="Define or paste the Dockerfile content here"
                    data-cy="image-build-editor"
                  >
                    Dockerfile syntax is documented in the{' '}
                    <a
                      href="https://docs.docker.com/reference/dockerfile/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Dockerfile reference
                    </a>
                    .
                  </WebEditorForm>
                  <FormSection title="Build context files">
                    <TextTip>
                      Add local files referenced by ADD or COPY in the
                      Dockerfile.
                    </TextTip>
                    <FilePicker
                      multiple
                      label="Select files"
                      onChange={setAdditionalFiles}
                      files={additionalFiles}
                      dataCy="image-build-additional-files"
                    />
                  </FormSection>
                </>
              )}

              {method === 'upload' && (
                <FormSection title="Upload">
                  <TextTip>
                    Upload a Dockerfile or a tar archive containing a
                    Dockerfile. A tar archive is used as the build context.
                  </TextTip>
                  <FilePicker
                    label="Select file"
                    onChange={(files) => setUploadFile(files[0])}
                    files={uploadFile ? [uploadFile] : []}
                    dataCy="image-build-upload-file"
                  />
                  <FormControl
                    label="Dockerfile path"
                    inputId="image_build_path_upload"
                  >
                    <Input
                      id="image_build_path_upload"
                      value={dockerfilePath}
                      onChange={(event) =>
                        setDockerfilePath(event.target.value)
                      }
                      placeholder="Dockerfile"
                      data-cy="image-path-input"
                    />
                  </FormControl>
                </FormSection>
              )}

              {method === 'url' && (
                <FormSection title="URL">
                  <TextTip>
                    Specify a Dockerfile, tarball, or public Git repository URL.
                  </TextTip>
                  <FormControl label="URL" inputId="image_build_url">
                    <Input
                      id="image_build_url"
                      value={remoteUrl}
                      onChange={(event) => setRemoteUrl(event.target.value)}
                      placeholder="https://example.com/image.tar.gz"
                      data-cy="image-url-input"
                    />
                  </FormControl>
                  <FormControl
                    label="Dockerfile path"
                    inputId="image_build_path_url"
                  >
                    <Input
                      id="image_build_path_url"
                      value={dockerfilePath}
                      onChange={(event) =>
                        setDockerfilePath(event.target.value)
                      }
                      placeholder="Dockerfile"
                      data-cy="image-path-input"
                    />
                  </FormControl>
                </FormSection>
              )}

              {isSwarmAgent && (
                <FormSection title="Deployment">
                  <NodeSelector value={nodeName} onChange={setNodeName} />
                </FormSection>
              )}

              <FormSection title="Actions">
                <LoadingButton
                  isLoading={buildMutation.isLoading}
                  loadingText="Image building in progress..."
                  disabled={!canBuild}
                  data-cy="image-build-submit"
                >
                  Build the image
                </LoadingButton>
              </FormSection>
            </form>
          ) : (
            <pre className="log_viewer" data-cy="logViewer">
              {buildLogs?.length
                ? buildLogs.map((line, index) => (
                    <div className="line" key={`${index}-${line.slice(0, 20)}`}>
                      <p className="inner_line">{line}</p>
                    </div>
                  ))
                : 'No build output available.'}
            </pre>
          )}
        </WidgetBody>
      </Widget>
    </>
  );

  async function build() {
    const imageNames = names.filter(Boolean);
    const options = { nodeName };
    let data;
    if (method === 'upload' && uploadFile) {
      data = await buildImageFromUpload(
        environmentId,
        imageNames,
        uploadFile,
        dockerfilePath,
        options
      );
    } else if (method === 'url') {
      data = await buildImageFromURL(
        environmentId,
        imageNames,
        remoteUrl,
        dockerfilePath,
        options
      );
    } else if (additionalFiles.length) {
      data = await buildImageFromDockerfileContentAndFiles(
        environmentId,
        imageNames,
        dockerfile,
        additionalFiles,
        options
      );
    } else {
      data = await buildImageFromDockerfileContent(
        environmentId,
        imageNames,
        dockerfile,
        options
      );
    }
    return new ImageBuildModel(data);
  }
}

function FilePicker({
  label,
  multiple,
  onChange,
  files,
  dataCy,
}: {
  label: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  files: File[];
  dataCy: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12 flex items-center gap-2">
        <Button
          type="button"
          color="primary"
          size="small"
          icon={Upload}
          as="label"
          data-cy={dataCy}
        >
          {label}
          <input
            type="file"
            className="hidden"
            multiple={multiple}
            onChange={(event) => onChange(Array.from(event.target.files || []))}
          />
        </Button>
        <span>{files.map((file) => file.name).join(', ')}</span>
      </div>
    </div>
  );
}

function validateNames(names: string[]) {
  return (
    names.length > 0 &&
    names.every((name, index) => validateName(name, names, index).valid)
  );
}

function validateName(name: string, names: string[], index: number) {
  const unique = names.every(
    (item, itemIndex) => itemIndex === index || item !== name
  );
  const repository = name.split('/').pop() || '';
  return {
    unique,
    valid:
      unique &&
      /^[a-z0-9-_.]{2,255}(:[A-Za-z0-9-_.]{1,128})?$/.test(repository),
  };
}
