import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/ui/components/buttons';
import { Input } from '@/ui/components/forms/Input';
import { Alert } from '@/ui/components/feedback/Alert';

import type { ExtensionRecord } from '../../../models/types';
import {
  settingsQueryKey,
  useExtensionSettings,
} from '../../../queries/useExtensionSettings';
import {
  extensionSettings,
  SettingsError,
  type ExtensionSettings,
  type SettingsUpdate,
} from '../../../services/settings.service';

import styles from './ExtensionConfiguration.module.css';

type Row = {
  id: number;
  key: string;
  value: string;
  secret: boolean;
  stored: boolean;
  remove: boolean;
};

export function ExtensionConfiguration({
  extension,
  disabled,
  onBusyChange,
}: {
  extension: ExtensionRecord;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const query = useExtensionSettings(extension);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('');
  const [confirmReload, setConfirmReload] = useState(false);
  async function reloadSettings() {
    setConfirmReload(false);
    const result = await query.refetch();
    if (result.isSuccess) {
      setNotice('Settings reloaded.');
      setReload((value) => value + 1);
    }
  }
  return (
    <section className={styles.root} aria-label="Saved extension settings">
      <h3>Saved settings</h3>
      <p>
        Configure this extension without enabling it or changing its
        permissions. Approved services can read settings through the gateway
        with explicit settings permissions. Secret access requires a separate
        permission.
      </p>
      {extension.manifest.settings && (
        <div role="group" aria-label="Settings schema">
          <h4>Declared settings</h4>
          <p>
            Only these keys are accepted. Boolean values use true or false;
            integers use decimal whole numbers.
          </p>
          <ul>
            {Object.entries(extension.manifest.settings.fields).map(
              ([key, field]) => (
                <li key={key}>
                  <code>{key}</code>: {field.type},{' '}
                  {field.secret ? 'secret' : 'public'},{' '}
                  {field.required ? 'required' : 'optional'}
                  {field.enum?.length
                    ? `; allowed values: ${field.enum.join(', ')}`
                    : ''}
                </li>
              )
            )}
          </ul>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {query.isLoading && <p role="status">Loading saved settings…</p>}
      {query.isError && (
        <Alert color="error">
          Unable to load saved settings. Check your access and connection.
        </Alert>
      )}
      <Button
        color="secondary"
        disabled={disabled || query.isFetching}
        onClick={() => {
          if (query.data) setConfirmReload(true);
          else void reloadSettings();
        }}
        data-cy="extension-reload-settings"
      >
        Reload settings
      </Button>
      {confirmReload && (
        <div role="group" aria-label="Confirm settings reload">
          <p>Reload saved settings and discard unsaved changes?</p>
          <div className={styles.actions}>
            <Button
              color="secondary"
              disabled={disabled || query.isFetching}
              onClick={() => void reloadSettings()}
              data-cy="extension-confirm-reload"
            >
              Confirm reload
            </Button>
            <Button
              color="secondary"
              onClick={() => setConfirmReload(false)}
              data-cy="extension-cancel-reload"
            >
              Cancel reload
            </Button>
          </div>
        </div>
      )}
      {query.isSuccess && !query.isFetching && (
        <SettingsForm
          key={`${query.data.version}:${reload}`}
          extension={extension}
          settings={query.data}
          disabled={disabled}
          onBusyChange={onBusyChange}
          onSaved={setNotice}
        />
      )}
    </section>
  );
}

function SettingsForm({
  extension,
  settings,
  disabled,
  onBusyChange,
  onSaved,
}: {
  extension: ExtensionRecord;
  settings: ExtensionSettings;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const client = useQueryClient();
  const [rows, setRows] = useState<Row[]>(() => [
    ...Object.entries(settings.values).map(([key, value], id) => ({
      id,
      key,
      value,
      secret: false,
      stored: true,
      remove: false,
    })),
    ...settings.secretKeys.map((key, id) => ({
      id: Object.keys(settings.values).length + id,
      key,
      value: '',
      secret: true,
      stored: true,
      remove: false,
    })),
  ]);
  const [nextId, setNextId] = useState(rows.length);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const busy = disabled || saving;
  function edit(id: number, patch: Partial<Row>) {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
    setError('');
  }
  async function persist(reset: boolean) {
    setError('');
    let update: SettingsUpdate | undefined;
    if (!reset) {
      try {
        update = buildUpdate(rows, settings.version);
      } catch (failure) {
        setError(
          failure instanceof Error ? failure.message : 'Invalid settings'
        );
        return;
      }
    }
    setSaving(true);
    onBusyChange(true);
    try {
      // Send secrets directly; mutation variables/errors must not retain them.
      const api = extensionSettings(extension);
      const saved = reset
        ? await api.reset(settings.version)
        : await api.update(update!);
      onSaved(reset ? 'All settings reset.' : 'Settings saved.');
      client.setQueryData(settingsQueryKey(extension), saved);
    } catch (failure) {
      setError(
        failure instanceof SettingsError
          ? failure.message
          : 'Unable to save settings. Reload settings before trying again.'
      );
      setBlocked(true);
      setRows((previous) =>
        previous.map((row) => (row.secret ? { ...row, value: '' } : row))
      );
    } finally {
      setSaving(false);
      onBusyChange(false);
    }
  }
  return (
    <div className={styles.root}>
      <p>
        Public values are readable. Saved secrets cannot be viewed; leave an
        existing secret blank to keep it. Removing an entry deletes it on save.
        Keys use letters, numbers, dots, underscores or hyphens and start with a
        letter.
      </p>
      <p className="text-muted">
        Up to 64 settings, 16 KiB per value and 64 KiB total. Trusted native UI
        runs in this browser context and may observe values while you enter
        them.
      </p>
      {error && <Alert color="error">{error}</Alert>}
      <fieldset disabled={busy || blocked} className={styles.fields}>
        <legend className="sr-only">Extension setting values</legend>
        {rows.length === 0 && <p>No saved settings.</p>}
        {rows.map((row, index) => (
          <div key={row.id} className={styles.row}>
            <label>
              Key {index + 1}
              <Input
                aria-label={`Setting key ${index + 1}`}
                value={row.key}
                readOnly={row.stored}
                disabled={row.remove}
                maxLength={64}
                autoComplete="off"
                onChange={(event) => edit(row.id, { key: event.target.value })}
                data-cy="extension-setting-key"
              />
            </label>
            <label>
              {row.secret ? 'Secret value' : 'Public value'} {index + 1}
              <Input
                type={row.secret ? 'password' : 'text'}
                aria-label={`${row.secret ? 'Secret' : 'Public'} value ${index + 1}`}
                value={row.value}
                placeholder={row.secret && row.stored ? 'Unchanged' : undefined}
                disabled={row.remove}
                autoComplete={row.secret ? 'new-password' : 'off'}
                onChange={(event) =>
                  edit(row.id, { value: event.target.value })
                }
                data-cy="extension-setting-value"
              />
            </label>
            <label className={styles.remove}>
              <input
                type="checkbox"
                checked={row.remove}
                onChange={(event) =>
                  edit(row.id, {
                    remove: event.target.checked,
                    ...(event.target.checked && row.secret
                      ? { value: '' }
                      : {}),
                  })
                }
              />
              Remove {row.key || `setting ${index + 1}`}
            </label>
          </div>
        ))}
        <div className={styles.actions}>
          <Button
            color="secondary"
            disabled={rows.length >= 64}
            onClick={() => {
              setRows([
                ...rows,
                {
                  id: nextId,
                  key: '',
                  value: '',
                  secret: false,
                  stored: false,
                  remove: false,
                },
              ]);
              setNextId(nextId + 1);
            }}
            data-cy="extension-add-value"
          >
            Add public setting
          </Button>
          <Button
            color="secondary"
            disabled={rows.length >= 64}
            onClick={() => {
              setRows([
                ...rows,
                {
                  id: nextId,
                  key: '',
                  value: '',
                  secret: true,
                  stored: false,
                  remove: false,
                },
              ]);
              setNextId(nextId + 1);
            }}
            data-cy="extension-add-secret"
          >
            Add secret
          </Button>
          <Button
            onClick={() => void persist(false)}
            data-cy="extension-save-settings"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
          <Button
            color="danger"
            onClick={() => setConfirmReset(true)}
            data-cy="extension-reset-settings"
          >
            Reset all settings
          </Button>
        </div>
        {confirmReset && (
          <div role="group" aria-label="Confirm settings reset">
            <p>
              Delete all saved public values and secrets for{' '}
              {extension.manifest.name}? This cannot be undone.
            </p>
            <div className={styles.actions}>
              <Button
                color="danger"
                onClick={() => void persist(true)}
                data-cy="extension-confirm-reset"
              >
                Confirm reset
              </Button>
              <Button
                color="secondary"
                onClick={() => setConfirmReset(false)}
                data-cy="extension-cancel-reset"
              >
                Cancel reset
              </Button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function buildUpdate(rows: Row[], version: number): SettingsUpdate {
  const active = rows.filter((row) => !row.remove);
  if (active.length > 64) throw new Error('Use at most 64 settings.');
  const seen = new Set<string>();
  let bytes = 0;
  const encoder = new TextEncoder();
  for (const row of active) {
    if (!/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(row.key) || seen.has(row.key))
      throw new Error(
        'Use unique keys of 1–64 characters, starting with a letter.'
      );
    if (
      !row.secret &&
      rows.some(
        (entry) => entry.secret && entry.stored && entry.key === row.key
      )
    )
      throw new Error(
        'Remove and save a secret before reusing its key for a public value.'
      );
    seen.add(row.key);
    const size = encoder.encode(row.value).length;
    if (size > 16384) throw new Error('Each value must be at most 16 KiB.');
    bytes += encoder.encode(row.key).length + size;
  }
  if (bytes > 65536)
    throw new Error(
      'Settings must fit within 64 KiB. Unchanged secrets also count toward the server limit.'
    );
  return {
    version,
    values: Object.fromEntries(
      active.filter((row) => !row.secret).map((row) => [row.key, row.value])
    ),
    secrets: Object.fromEntries(
      rows
        .filter(
          (row) =>
            row.secret &&
            ((row.stored && row.remove) ||
              (!row.remove && (!row.stored || row.value !== '')))
        )
        .map((row) => [row.key, row.remove ? null : row.value])
    ),
  };
}
