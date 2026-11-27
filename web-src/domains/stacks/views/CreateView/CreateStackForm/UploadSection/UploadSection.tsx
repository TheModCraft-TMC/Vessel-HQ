import { useFormikContext } from 'formik';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { stackProjectInspect } from '@api/sdk.gen';

import { textByType } from '@/domains/stacks/components/common/form-texts';
import { StackType } from '@/domains/stacks/models/types';
import { FileUploadForm } from '@/ui/components/forms/FileUpload';
import { Checkbox } from '@/ui/components/forms/Checkbox';
import { Alert } from '@/ui/components/feedback/Alert';
import { FormError } from '@/ui/components/forms/FormError';

import { FormValues } from '../types';

interface ProjectPreview {
  archiveDigest: string;
  manifest: { composeFiles: string[]; environmentNames: string[] };
  files: Record<string, string>;
}

export function UploadSection({ isSwarm }: { isSwarm: boolean }) {
  const texts =
    textByType[isSwarm ? StackType.DockerSwarm : StackType.DockerCompose];
  const { values, errors, setFieldValue } = useFormikContext<FormValues>();
  const [preview, setPreview] = useState<ProjectPreview>();
  const [reviewFile, setReviewFile] = useState('');
  const selectedFile = useRef<File | undefined>(undefined);
  const inspect = useMutation({
    mutationFn: async (file: File) => {
      const { data } = await stackProjectInspect({ body: { file } });
      if (
        !data?.manifest?.composeFiles?.length ||
        !data.archiveDigest ||
        !data.files
      ) {
        throw new Error('Incomplete project preview');
      }
      return {
        archiveDigest: data.archiveDigest,
        files: data.files,
        manifest: {
          composeFiles: data.manifest.composeFiles,
          environmentNames: data.manifest.environmentNames ?? [],
        },
      };
    },
  });

  return (
    <>
      <FileUploadForm
        value={values.upload.file || undefined}
        onChange={handleFile}
        required
        description={
          <>
            {texts.upload} You can also import a portable Vessel project ZIP,
            preserving its Compose overrides.
          </>
        }
        data-cy="stack-creation-file-upload"
        error={errors.upload?.file}
      />
      {inspect.isLoading && <p role="status">Validating project archive…</p>}
      {inspect.isError && (
        <FormError>
          Unable to validate this project archive. Check its manifest, checksums
          and Compose YAML.
        </FormError>
      )}
      {preview && (
        <Alert color="info" title="Review imported Compose project">
          <p>
            Archive integrity and YAML syntax passed. Review the files in their
            deployment order:
          </p>
          <ol className="max-h-64 overflow-auto break-all">
            {preview.manifest.composeFiles.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ol>
          <label htmlFor="project-review-file">Review file content</label>
          <select
            id="project-review-file"
            className="form-control"
            value={reviewFile}
            onChange={(event) => setReviewFile(event.target.value)}
          >
            {preview.manifest.composeFiles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <pre className="max-h-64 overflow-auto break-all whitespace-pre-wrap">
            {preview.files[reviewFile]}
          </pre>
          <p>
            Environment names:{' '}
            {preview.manifest.environmentNames.join(', ') || 'none declared'}.
          </p>
          <p>
            Supply values, bind directories, build contexts, secret/config
            files, includes and external networks/volumes separately. Literal
            source values may contain secrets. Preview does not resolve these
            dependencies or deploy anything.
          </p>
          <Checkbox
            id="stack-project-review"
            data-cy="stack-project-review"
            checked={!!values.upload.projectDigest}
            label="I reviewed this project and supplied its external requirements"
            onChange={(event) =>
              void setFieldValue(
                'upload.projectDigest',
                event.target.checked ? preview.archiveDigest : undefined
              )
            }
          />
          {errors.upload?.projectDigest && (
            <FormError>{errors.upload.projectDigest}</FormError>
          )}
        </Alert>
      )}
    </>
  );

  function handleFile(file?: File) {
    selectedFile.current = file;
    setPreview(undefined);
    inspect.reset();
    void setFieldValue('upload.projectDigest', undefined, false);
    void setFieldValue('upload.file', file ?? null);
    if (file?.name.toLowerCase().endsWith('.zip')) {
      inspect.mutate(file, {
        onSuccess(data) {
          if (selectedFile.current === file) {
            setPreview(data);
            setReviewFile(data.manifest.composeFiles[0] ?? '');
          }
        },
      });
    }
  }
}
