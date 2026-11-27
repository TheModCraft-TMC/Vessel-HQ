import { useId, useState } from 'react';
import { Copy } from 'lucide-react';

import { Button } from '@/ui/components/buttons';
import { useCopy } from '@/ui/components/buttons/CopyButton/useCopy';
import { FormError } from '@/ui/components/forms/FormError';
import { TextArea } from '@/ui/components/forms/Input/Textarea';

import { dockerRunToCompose } from './dockerRunToCompose';

export function DockerRunImport({
  isEmpty,
  onInsert,
}: {
  isEmpty: boolean;
  onInsert(value: string): void;
}) {
  const commandId = useId();
  const previewId = useId();
  const [command, setCommand] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const { handleCopy } = useCopy(() => preview);

  return (
    <details className="mb-3">
      <summary className="cursor-pointer">
        Convert Docker run to Compose
      </summary>
      <div className="mt-2 flex min-w-0 flex-col gap-2">
        <label htmlFor={commandId}>Docker run command</label>
        <TextArea
          id={commandId}
          data-cy="docker-run-command"
          value={command}
          rows={3}
          maxLength={32_768}
          spellCheck={false}
          placeholder="docker run -d --name web -p 8080:80 nginx"
          onChange={(event) => {
            setCommand(event.target.value);
            setPreview('');
            setError('');
          }}
        />
        <div>
          <Button
            onClick={convert}
            disabled={!command.trim()}
            data-cy="docker-run-preview-button"
          >
            Preview Compose
          </Button>
        </div>
        {error && <FormError>{error}</FormError>}
        {preview && (
          <>
            <label htmlFor={previewId}>Generated Compose YAML</label>
            <TextArea
              id={previewId}
              value={preview}
              rows={8}
              readOnly
              data-cy="docker-run-compose-preview"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                icon={Copy}
                color="secondary"
                onClick={handleCopy}
                data-cy="docker-run-copy-yaml"
              >
                Copy YAML
              </Button>
              {isEmpty && (
                <Button
                  onClick={() => onInsert(preview)}
                  data-cy="docker-run-insert-yaml"
                >
                  Insert YAML
                </Button>
              )}
            </div>
            {!isEmpty && (
              <p>Copy the YAML to merge it into your current file.</p>
            )}
          </>
        )}
      </div>
    </details>
  );

  function convert() {
    try {
      setPreview(dockerRunToCompose(command));
      setError('');
    } catch (problem) {
      setPreview('');
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to convert the command.'
      );
    }
  }
}
