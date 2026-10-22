'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Plus, Puzzle } from 'lucide-react';
import { PageContent } from '@console/layout/PageContent';
import { Link } from '@console/navigation/Link';

import { useIsPureAdmin } from '@/core/session/useUser';
import { Button } from '@/ui/components/buttons';
import { Widget } from '@/ui/components/Widget';
import { Alert } from '@/ui/components/feedback/Alert';

import type { ExtensionManifest } from '../../models/types';
import {
  useExtensionActions,
  useExtensions,
} from '../../queries/useExtensions';

import { UploadExtension } from './UploadExtension';
import styles from './ExtensionsView.module.css';

export function ExtensionsView() {
  const isAdmin = useIsPureAdmin();
  if (!isAdmin) {
    return (
      <PageContent>
        <Alert color="error">
          Only administrators can manage native extensions.
        </Alert>
      </PageContent>
    );
  }
  return <ExtensionAdministration />;
}

function ExtensionAdministration() {
  const extensions = useExtensions();
  const actions = useExtensionActions();
  const input = useRef<HTMLInputElement>(null);
  const [manifest, setManifest] = useState('');
  const [error, setError] = useState('');
  const busy = Object.values(actions).some((action) => action.isLoading);

  async function register() {
    setError('');
    try {
      await actions.register.mutateAsync(
        JSON.parse(manifest) as ExtensionManifest
      );
      setManifest('');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to register extension'
      );
    }
  }

  return (
    <PageContent>
      <div className={styles.root}>
        <Alert color="info" title="Make Vessel your own">
          Use Add extension to upload a .vesselhq package (up to 64 MiB), then
          open an extension to review its permissions and settings. Uploading
          never runs code or grants access.
        </Alert>
        {error && <Alert color="error">{error}</Alert>}
        {extensions.isLoading && <p role="status">Loading extensions…</p>}
        {extensions.isError && (
          <Alert color="error">
            {extensions.error instanceof Error
              ? extensions.error.message
              : 'Unable to load extensions'}
          </Alert>
        )}
        <div className={styles.cards} aria-label="Registered extensions">
          {extensions.data?.map((extension) => (
            <Link
              key={extension.id}
              to={`/extensions/${encodeURIComponent(extension.manifest.id)}`}
              className={styles.card}
              aria-label={`Open ${extension.manifest.name}`}
            >
              <span className={styles.extensionIcon}>
                <Puzzle size={24} aria-hidden="true" />
              </span>
              <span className={styles.cardText}>
                <strong>{extension.manifest.name}</strong>
                <span className="text-muted">{extension.manifest.version}</span>
              </span>
              <ArrowRight
                className={styles.arrow}
                size={16}
                aria-hidden="true"
              />
            </Link>
          ))}
          <button
            type="button"
            className={styles.addCard}
            onClick={() => input.current?.click()}
            disabled={busy}
            aria-label="Add extension package"
          >
            <Plus size={24} aria-hidden="true" />
            <span>Add extension</span>
          </button>
        </div>
        {extensions.isSuccess && !extensions.data.length && (
          <p className="text-muted">
            No extensions yet. Choose Add extension to upload your first
            package.
          </p>
        )}
        <UploadExtension
          compact
          inputRef={input}
          disabled={busy}
          onUpload={(file, signal) =>
            actions.upload.mutateAsync({ file, signal })
          }
        />
        <details className={styles.advanced}>
          <summary className="cursor-pointer font-semibold">
            Advanced: register a manifest manually
          </summary>
          <Widget>
            <Widget.Title icon={Puzzle} title="Register extension manifest" />
            <Widget.Body>
              <p>
                Register a v1 manifest with a pinned package digest. Replacing
                an existing extension creates a new revision and clears previous
                approvals.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void register();
                }}
              >
                <label htmlFor="extension-manifest">Manifest JSON</label>
                <textarea
                  id="extension-manifest"
                  className="form-control mb-3 font-mono"
                  rows={10}
                  value={manifest}
                  onChange={(event) => setManifest(event.target.value)}
                  required
                />
                <Button
                  type="submit"
                  disabled={busy || !manifest.trim()}
                  data-cy="extension-register"
                >
                  Register manifest
                </Button>
              </form>
            </Widget.Body>
          </Widget>
        </details>
      </div>
    </PageContent>
  );
}
