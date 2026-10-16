'use client';

import { useState, type ReactNode } from 'react';
import { Puzzle, Settings } from 'lucide-react';
import { PageContent } from '@console/layout/PageContent';
import { Link } from '@console/navigation/Link';

import { useIsPureAdmin } from '@/core/session/useUser';
import { Button } from '@/ui/components/buttons';
import { Alert } from '@/ui/components/feedback/Alert';
import { Modal } from '@/ui/components/dialog/Modal';

import type { ExtensionRecord } from '../../models/types';
import {
  useExtensionActions,
  useExtensions,
} from '../../queries/useExtensions';
import { PermissionReview } from '../ExtensionsView/PermissionReview';

import styles from './ExtensionDetailsView.module.css';

export function ExtensionDetailsView({
  extensionId,
  children,
}: {
  extensionId: string;
  children: ReactNode;
}) {
  const isAdmin = useIsPureAdmin();
  if (!isAdmin)
    return (
      <PageContent>
        <Alert color="error">
          Only administrators can manage native extensions.
        </Alert>
      </PageContent>
    );
  return (
    <ExtensionDetails extensionId={extensionId}>{children}</ExtensionDetails>
  );
}

function ExtensionDetails({
  extensionId,
  children,
}: {
  extensionId: string;
  children: ReactNode;
}) {
  const query = useExtensions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const extension = query.data?.find(
    (item) => item.manifest.id === extensionId
  );
  if (query.isLoading)
    return (
      <PageContent>
        <p role="status">Loading extension…</p>
      </PageContent>
    );
  if (query.isError)
    return (
      <PageContent>
        <Alert color="error">Unable to load extension settings.</Alert>
      </PageContent>
    );
  if (!extension)
    return (
      <PageContent>
        <p>This extension is no longer registered.</p>
        <Link to="/extensions">Return to extensions</Link>
      </PageContent>
    );

  return (
    <PageContent>
      <div className={styles.root}>
        <Link to="/extensions">← Extensions</Link>
        <header className={styles.header}>
          <span className={styles.icon}>
            <Puzzle size={32} aria-hidden="true" />
          </span>
          <div className={styles.identity}>
            <h2>{extension.manifest.name}</h2>
            <span className="text-muted">
              Version {extension.manifest.version}
            </span>
          </div>
          <Button
            icon={Settings}
            color="secondary"
            onClick={() => setSettingsOpen(true)}
            aria-label={`Configure ${extension.manifest.name}`}
            data-cy="extension-open-settings"
          >
            Settings
          </Button>
        </header>
        {extension.manifest.description && (
          <p>{extension.manifest.description}</p>
        )}
        {children}
        {settingsOpen && (
          <ExtensionSettings
            key={`${extension.id}:${extension.revision}`}
            extension={extension}
            onDismiss={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </PageContent>
  );
}

function ExtensionSettings({
  extension,
  onDismiss,
}: {
  extension: ExtensionRecord;
  onDismiss: () => void;
}) {
  const actions = useExtensionActions();
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const busy = Object.values(actions).some((action) => action.isLoading);
  async function run(operation: () => Promise<unknown>) {
    setError('');
    try {
      await operation();
      onDismiss();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to update extension'
      );
    }
  }
  const settings = [
    [
      'Package',
      extension.packageAvailable
        ? 'Uploaded'
        : 'Manifest only; package not uploaded',
    ],
    [
      'Permission status',
      extension.status === 'approved'
        ? 'Approved'
        : extension.status === 'disabled'
          ? 'Disabled'
          : 'Pending approval',
    ],
    [
      'Unattended environment metadata reads',
      extension.serviceReadEnabled ? 'Approved' : 'Not approved',
    ],
    [
      'Backend',
      extension.manifest.backend
        ? extension.packageAvailable
          ? 'Uploaded, not started'
          : 'Package not uploaded'
        : 'Not bundled',
    ],
  ];
  const packageDetails = [
    ['Approved capabilities', String(extension.grants.length)],
    ['Native UI trust', extension.trustedNativeUI ? 'Granted' : 'Not granted'],
    ['UI activation', 'Not activated'],
    ...(extension.manifest.backend
      ? [
          [
            'Backend platforms',
            Object.keys(extension.manifest.backend.entrypoints).join(', '),
          ],
        ]
      : []),
    ['Revision', String(extension.revision)],
    ['Package digest', extension.manifest.packageDigest],
    ...(extension.archiveDigest
      ? [['Archive digest', extension.archiveDigest]]
      : []),
  ];
  return (
    <Modal
      size="xl"
      aria-label={`${extension.manifest.name} settings`}
      onDismiss={busy ? undefined : onDismiss}
    >
      <Modal.Header title={`${extension.manifest.name} settings`} />
      <Modal.Body>
        <div className={styles.settings}>
          {error && <Alert color="error">{error}</Alert>}
          <table className={styles.table}>
            <caption className="sr-only">
              Current extension configuration
            </caption>
            <thead>
              <tr>
                <th scope="col">Setting</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {settings.map(([name, value]) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PermissionReview
            extension={extension}
            busy={busy}
            onCancel={onDismiss}
            onApprove={(approval) =>
              run(() =>
                actions.approve.mutateAsync({ id: extension.id, approval })
              )
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button
              color="secondary"
              disabled={busy || extension.status === 'disabled'}
              onClick={() =>
                void run(() => actions.disable.mutateAsync(extension.id))
              }
              data-cy="extension-disable"
            >
              Disable and revoke grants
            </Button>
            <Button
              color="danger"
              disabled={busy}
              onClick={() => setConfirmRemove(true)}
              data-cy="extension-remove"
            >
              Remove extension
            </Button>
          </div>
          {confirmRemove && (
            <div role="group" aria-label="Confirm extension removal">
              <p>
                Remove {extension.manifest.name}, revoke all its grants, and
                delete its saved notes?
              </p>
              <div className="flex gap-2">
                <Button
                  color="danger"
                  disabled={busy}
                  onClick={() =>
                    void run(() => actions.remove.mutateAsync(extension.id))
                  }
                  data-cy="extension-confirm-remove"
                >
                  Confirm removal
                </Button>
                <Button
                  color="secondary"
                  disabled={busy}
                  onClick={() => setConfirmRemove(false)}
                  data-cy="extension-cancel-remove"
                >
                  Cancel removal
                </Button>
              </div>
            </div>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">
              Package details
            </summary>
            <table className={styles.table}>
              <caption className="sr-only">Extension package metadata</caption>
              <tbody>
                {packageDetails.map(([name, value]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </Modal.Body>
    </Modal>
  );
}
