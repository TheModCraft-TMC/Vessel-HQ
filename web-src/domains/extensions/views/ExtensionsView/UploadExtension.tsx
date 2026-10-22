import { useRef, useState, type RefObject } from 'react';
import { Upload } from 'lucide-react';

import { Button } from '@/ui/components/buttons';
import { Alert } from '@/ui/components/feedback/Alert';
import { Widget } from '@/ui/components/Widget';

import styles from './UploadExtension.module.css';

export const maxExtensionUploadBytes = 64 * 1024 * 1024;

export function UploadExtension({
  disabled,
  onUpload,
  inputRef,
  compact = false,
}: {
  disabled: boolean;
  onUpload: (file: File, signal: AbortSignal) => Promise<unknown>;
  inputRef?: RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  const localInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? localInput;
  const request = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [inputRevision, setInputRevision] = useState(0);

  function selectFile(selected?: File) {
    setStatus('');
    setError('');
    setFile(undefined);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.vesselhq')) {
      setError('Choose a .vesselhq extension package (a renamed ZIP archive).');
      return;
    }
    if (selected.size > maxExtensionUploadBytes) {
      setError('Extension packages must be 64 MiB or smaller.');
      return;
    }
    setFile(selected);
  }

  async function upload() {
    if (!file) return;
    const controller = new AbortController();
    request.current = controller;
    setUploading(true);
    setError('');
    setStatus('');
    try {
      await onUpload(file, controller.signal);
      setStatus(
        compact
          ? 'Package uploaded. Review its permissions before approving access. No code has been activated.'
          : 'Package uploaded. Review its permissions before approving access. UI code has not been built or activated; bundled backend executables have not been started.'
      );
      setFile(undefined);
      setInputRevision((previous) => previous + 1);
    } catch (failure) {
      if (controller.signal.aborted) {
        setStatus(
          'Upload cancelled. The server may already have received the package; check the extension list before retrying.'
        );
      } else {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Unable to upload extension package'
        );
      }
    } finally {
      request.current = null;
      setUploading(false);
    }
  }

  const reveal = !!file || !!error || uploading || !!status;
  const content = (
    <div className={compact && !reveal ? styles.idle : styles.root}>
      {!compact && (
        <p>
          Add a <strong>.vesselhq</strong> package to Vessel. Packages are ZIP
          archives containing an extension manifest, UI source, and optional
          backend binaries. Uploads never run code or grant permissions.
        </p>
      )}
      {(!compact || file) && (
        <p className="text-muted">
          Replacing an existing package creates a new revision and clears its
          previous permission approvals.
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void upload();
        }}
      >
        <div className={compact ? styles.hiddenPicker : styles.dropzone}>
          <label htmlFor="extension-package" className="font-semibold">
            Extension package
          </label>
          <p id="extension-package-help" className="text-muted">
            Choose a .vesselhq file, up to 64 MiB.
          </p>
          <input
            key={inputRevision}
            ref={input}
            id="extension-package"
            type="file"
            accept=".vesselhq"
            aria-describedby="extension-package-help"
            disabled={disabled || uploading}
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </div>
        {file && (
          <p className="mt-2 break-all">
            {file.name} · {(file.size / 1024).toFixed(1)} KiB
          </p>
        )}
        {(!compact || file || uploading) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              icon={Upload}
              type="submit"
              disabled={disabled || uploading || !file}
              data-cy="extension-upload"
            >
              {uploading ? 'Uploading package…' : 'Upload package'}
            </Button>
            {uploading && (
              <Button
                color="secondary"
                onClick={() => request.current?.abort()}
                data-cy="extension-cancel-upload"
              >
                Cancel upload
              </Button>
            )}
            {file && !uploading && (
              <Button
                color="secondary"
                disabled={disabled}
                onClick={() => {
                  setFile(undefined);
                  setError('');
                  setInputRevision((previous) => previous + 1);
                }}
                data-cy="extension-clear-upload"
              >
                Clear selection
              </Button>
            )}
          </div>
        )}
      </form>
      {uploading && <p role="status">Uploading and validating package…</p>}
      {error && <Alert color="error">{error}</Alert>}
      {status && <Alert color="info">{status}</Alert>}
    </div>
  );
  return compact ? (
    content
  ) : (
    <Widget>
      <Widget.Title icon={Upload} title="Upload an extension" />
      <Widget.Body>{content}</Widget.Body>
    </Widget>
  );
}
