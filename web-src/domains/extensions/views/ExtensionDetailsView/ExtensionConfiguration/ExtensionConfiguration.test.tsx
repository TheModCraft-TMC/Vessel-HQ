import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import type { ExtensionRecord } from '../../../models/types';
import {
  extensionSettings,
  SettingsError,
} from '../../../services/settings.service';

import { ExtensionConfiguration } from './ExtensionConfiguration';

vi.mock('../../../services/settings.service', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../services/settings.service')
  >()),
  extensionSettings: vi.fn(),
}));
const record: ExtensionRecord = {
  id: 7,
  revision: 4,
  status: 'disabled',
  trustedNativeUI: false,
  grants: [],
  updatedAt: 1,
  manifest: {
    id: 'org.example.settings',
    name: 'Inspector',
    version: '1',
    apiVersion: 'v1',
    packageDigest: `sha256:${'a'.repeat(64)}`,
    permissions: [],
  },
};
const read = vi.fn();
const update = vi.fn();
const reset = vi.fn();
const busy = vi.fn();
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
    logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
  });
  read.mockResolvedValue({
    version: 2,
    values: { theme: 'dark' },
    secretKeys: ['token'],
  });
  vi.mocked(extensionSettings).mockReturnValue({ read, update, reset });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});
function renderEditor() {
  render(
    <QueryClientProvider client={client}>
      <ExtensionConfiguration
        extension={record}
        disabled={false}
        onBusyChange={busy}
      />
    </QueryClientProvider>
  );
}
async function ready() {
  return screen.findByRole('button', { name: 'Save settings' });
}

it('edits public settings and replaces secrets without retaining secret mutation variables', async () => {
  update.mockResolvedValue({
    version: 3,
    values: { theme: 'light' },
    secretKeys: ['token'],
  });
  renderEditor();
  await ready();
  expect(screen.getByLabelText('Secret value 2')).toHaveValue('');
  expect(screen.getByLabelText('Setting key 2')).toHaveAttribute('readonly');
  await userEvent.clear(screen.getByLabelText('Public value 1'));
  await userEvent.type(screen.getByLabelText('Public value 1'), 'light');
  await userEvent.type(
    screen.getByLabelText('Secret value 2'),
    'private-value'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({
      version: 2,
      values: { theme: 'light' },
      secrets: { token: 'private-value' },
    })
  );
  expect(await screen.findByText('Settings saved.')).toBeVisible();
  expect(screen.getByLabelText('Secret value 2')).toHaveValue('');
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state)
    )
  ).not.toContain('private-value');
  expect(client.getMutationCache().getAll()).toHaveLength(0);
  expect(busy).toHaveBeenLastCalledWith(false);
});

it('preserves unchanged secrets and supports adding a public value and a new secret', async () => {
  update.mockResolvedValue({
    version: 3,
    values: { theme: 'dark', mode: 'demo' },
    secretKeys: ['token', 'password'],
  });
  renderEditor();
  await ready();
  await userEvent.click(
    screen.getByRole('button', { name: 'Add public setting' })
  );
  await userEvent.type(screen.getByLabelText('Setting key 3'), 'mode');
  await userEvent.type(screen.getByLabelText('Public value 3'), 'demo');
  await userEvent.click(screen.getByRole('button', { name: 'Add secret' }));
  await userEvent.type(screen.getByLabelText('Setting key 4'), 'password');
  await userEvent.type(screen.getByLabelText('Secret value 4'), 'new-secret');
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({
      version: 2,
      values: { theme: 'dark', mode: 'demo' },
      secrets: { password: 'new-secret' },
    })
  );
});

it('removes saved secrets explicitly and confirms or cancels reset', async () => {
  update.mockResolvedValue({
    version: 3,
    values: { theme: 'dark' },
    secretKeys: [],
  });
  reset.mockResolvedValue({ version: 4, values: {}, secretKeys: [] });
  renderEditor();
  await ready();
  await userEvent.click(screen.getByLabelText('Remove token'));
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({
      version: 2,
      values: { theme: 'dark' },
      secrets: { token: null },
    })
  );
  await screen.findByText('Settings saved.');
  await userEvent.click(
    screen.getByRole('button', { name: 'Reset all settings' })
  );
  expect(reset).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel reset' }));
  expect(
    screen.queryByRole('group', { name: 'Confirm settings reset' })
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Reset all settings' })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Confirm reset' }));
  await waitFor(() => expect(reset).toHaveBeenCalledWith(3));
  expect(await screen.findByText('All settings reset.')).toBeVisible();
  expect(screen.getByText('No saved settings.')).toBeVisible();
});

it('blocks conflicting writes, clears entered secrets and reloads before allowing another save', async () => {
  update.mockRejectedValue(new SettingsError(true));
  renderEditor();
  await ready();
  await userEvent.type(screen.getByLabelText('Secret value 2'), 'discard-me');
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(
    await screen.findByText(/The extension or its settings changed/)
  ).toBeVisible();
  expect(screen.getByLabelText('Secret value 2')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  read.mockResolvedValue({
    version: 5,
    values: { theme: 'server' },
    secretKeys: ['token'],
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload settings' })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Cancel reload' }));
  expect(read).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Reload settings' })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Confirm reload' }));
  expect(await screen.findByDisplayValue('server')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
});

it('validates duplicate keys and UTF-8 byte limits before sending values', async () => {
  renderEditor();
  await ready();
  await userEvent.click(
    screen.getByRole('button', { name: 'Add public setting' })
  );
  await userEvent.type(screen.getByLabelText('Setting key 3'), 'theme');
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(await screen.findByText(/Use unique keys/)).toBeVisible();
  expect(update).not.toHaveBeenCalled();
  await userEvent.clear(screen.getByLabelText('Setting key 3'));
  await userEvent.type(screen.getByLabelText('Setting key 3'), 'another');
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(screen.getByLabelText('Public value 3'), {
    target: { value: 'é'.repeat(8193) },
  });
  await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  expect(
    await screen.findByText('Each value must be at most 16 KiB.')
  ).toBeVisible();
  expect(update).not.toHaveBeenCalled();
});

it('fails closed when settings cannot be loaded', async () => {
  read.mockRejectedValue(new SettingsError(false));
  renderEditor();
  expect(
    await screen.findByText(/Unable to load saved settings/)
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Save settings' })
  ).not.toBeInTheDocument();
  expect(update).not.toHaveBeenCalled();
});
