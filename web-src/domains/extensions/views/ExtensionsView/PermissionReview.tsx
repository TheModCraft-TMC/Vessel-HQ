import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/ui/components/buttons';
import { Widget } from '@/ui/components/Widget';
import { Alert } from '@/ui/components/feedback/Alert';

import type {
  ExtensionApproval,
  ExtensionPermission,
  ExtensionRecord,
} from '../../models/types';

export function PermissionReview({
  extension,
  busy,
  onCancel,
  onApprove,
}: {
  extension: ExtensionRecord;
  busy: boolean;
  onCancel: () => void;
  onApprove: (approval: ExtensionApproval) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [trusted, setTrusted] = useState(false);
  const [serviceReadEnabled, setServiceReadEnabled] = useState(false);
  const requestsNativeUI = extension.manifest.permissions.some(
    (permission) => permission.capability === 'ui.native'
  );
  const nativeSelected = selected.includes('ui.native');
  const environmentReadSelected = selected.some((key) =>
    key.startsWith('environments.read:')
  );

  function toggle(key: string) {
    if (key.startsWith('environments.read:')) {
      setServiceReadEnabled(false);
    }
    setSelected((previous) =>
      previous.includes(key)
        ? previous.filter((value) => value !== key)
        : [...previous, key]
    );
  }

  function submit() {
    const grants = extension.manifest.permissions.flatMap<ExtensionPermission>(
      (permission) => {
        if (
          [
            'ui.native',
            'storage.read',
            'storage.write',
            'storage.service.read',
            'storage.service.write',
          ].includes(permission.capability)
        ) {
          return selected.includes(permission.capability)
            ? [{ capability: permission.capability, environmentIds: [] }]
            : [];
        }
        const environmentIds = permission.environmentIds.filter((id) =>
          selected.includes(`${permission.capability}:${id}`)
        );
        if (
          ['stacks.network.read', 'stacks.traffic.read'].includes(
            permission.capability
          )
        ) {
          const stackIds =
            permission.stackIds?.filter((id) =>
              selected.includes(`${permission.capability}:stack:${id}`)
            ) || [];
          return environmentIds.length && stackIds.length
            ? [{ capability: permission.capability, environmentIds, stackIds }]
            : [];
        }
        return environmentIds.length
          ? [{ capability: permission.capability, environmentIds }]
          : [];
      }
    );
    void onApprove({
      revision: extension.revision,
      trustedNativeUI: nativeSelected && trusted,
      serviceReadEnabled: environmentReadSelected && serviceReadEnabled,
      grants,
    });
  }

  return (
    <Widget>
      <Widget.Title
        icon={ShieldCheck}
        title={`Review ${extension.manifest.name} permissions`}
      />
      <Widget.Body>
        <p>
          Revision {extension.revision}. Nothing is selected automatically.
          Select only the capabilities, environments, and stacks you approve.
        </p>
        {requestsNativeUI && (
          <Alert color="warn" title="Native UI is trusted code">
            Native frontend code runs inside the console and can access your
            browser session. Backend capability grants do not isolate browser
            code. Only approve packages you trust.
          </Alert>
        )}
        <fieldset disabled={busy} className="mt-3 space-y-2">
          <legend className="text-sm">Requested permissions</legend>
          {extension.manifest.permissions.length === 0 && (
            <p>No permissions requested.</p>
          )}
          {extension.manifest.permissions.map((permission) => (
            <div key={permission.capability}>
              {permission.capability === 'ui.native' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={nativeSelected}
                    onChange={() => toggle('ui.native')}
                  />
                  Run native UI code
                </label>
              ) : permission.capability === 'storage.read' ||
                permission.capability === 'storage.write' ||
                permission.capability === 'storage.service.read' ||
                permission.capability === 'storage.service.write' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(permission.capability)}
                    onChange={() => toggle(permission.capability)}
                  />
                  {permission.capability === 'storage.read'
                    ? 'Read this extension’s saved notes'
                    : permission.capability === 'storage.write'
                      ? 'Write this extension’s saved notes'
                      : permission.capability === 'storage.service.read'
                        ? 'Allow the service to read its saved notes without a user session'
                        : 'Allow the service to write its saved notes without a user session'}
                </label>
              ) : (
                permission.environmentIds.map((id) => (
                  <label key={id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(
                        `${permission.capability}:${id}`
                      )}
                      onChange={() => toggle(`${permission.capability}:${id}`)}
                    />
                    {permission.capability} — environment {id}
                  </label>
                ))
              )}
              {['stacks.network.read', 'stacks.traffic.read'].includes(
                permission.capability
              ) && (
                <div className="ml-4 mt-2 space-y-2">
                  <p className="text-muted">
                    Stack network and traffic reads apply only to the selected
                    stacks in the selected environments. No stack writes or
                    credentials are included.
                  </p>
                  {permission.stackIds?.map((id) => (
                    <label key={id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(
                          `${permission.capability}:stack:${id}`
                        )}
                        onChange={() =>
                          toggle(`${permission.capability}:stack:${id}`)
                        }
                      />
                      {permission.capability} — stack {id}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {nativeSelected && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={trusted}
                onChange={(event) => setTrusted(event.target.checked)}
              />
              I trust this package to run code inside the Vessel console.
            </label>
          )}
          {environmentReadSelected && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={serviceReadEnabled}
                  onChange={(event) =>
                    setServiceReadEnabled(event.target.checked)
                  }
                />
                Allow unattended read-only gRPC access to selected environments
              </label>
              <p className="text-muted">
                Allows the extension service to read approved environment
                metadata without an active user session, using its mTLS
                identity. No credentials or infrastructure operations are
                exposed. Changing environment scopes clears this
                acknowledgement.
              </p>
            </div>
          )}
        </fieldset>
        <div className="mt-4 flex gap-2">
          <Button
            disabled={busy || (nativeSelected && !trusted)}
            onClick={submit}
            data-cy="extension-approve"
          >
            Save permission approval
          </Button>
          <Button
            color="secondary"
            disabled={busy}
            onClick={onCancel}
            data-cy="extension-cancel-review"
          >
            Cancel
          </Button>
        </div>
      </Widget.Body>
    </Widget>
  );
}
