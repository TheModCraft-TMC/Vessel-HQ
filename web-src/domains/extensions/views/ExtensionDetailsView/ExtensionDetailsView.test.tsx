import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { useIsPureAdmin } from '@/core/session/useUser';

import {
  approveExtension,
  disableExtension,
  getExtensions,
  removeExtension,
} from '../../services/extensions.service';

import { ExtensionDetailsView } from './ExtensionDetailsView';

vi.mock('@/core/session/useUser', () => ({ useIsPureAdmin: vi.fn() }));
vi.mock('../../services/extensions.service', () => ({
  getExtensions: vi.fn(),
  registerExtension: vi.fn(),
  approveExtension: vi.fn(),
  disableExtension: vi.fn(),
  removeExtension: vi.fn(),
  uploadExtension: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useIsPureAdmin).mockReturnValue(true);
  vi.mocked(getExtensions).mockResolvedValue([
    {
      id: 7,
      manifest: {
        id: 'org.example.inspector',
        name: 'Inspector',
        description: 'Inspect approved resources',
        version: '1.0.0',
        apiVersion: 'v1',
        packageDigest: `sha256:${'a'.repeat(64)}`,
        permissions: [
          { capability: 'ui.native', environmentIds: [] },
          { capability: 'environments.read', environmentIds: [1] },
        ],
        backend: {
          type: 'executable',
          entrypoints: { 'linux-amd64': 'backend/linux-amd64/extension' },
        },
      },
      revision: 3,
      status: 'approved',
      grants: [{ capability: 'ui.native', environmentIds: [] }],
      trustedNativeUI: true,
      serviceReadEnabled: true,
      packageAvailable: true,
      updatedAt: 1,
    },
  ]);
  vi.mocked(disableExtension).mockResolvedValue(undefined);
  vi.mocked(removeExtension).mockResolvedValue(undefined);
});

function renderView() {
  const View = withTestQueryProvider(() => (
    <ExtensionDetailsView extensionId="org.example.inspector">
      <p>Native host content</p>
    </ExtensionDetailsView>
  ));
  render(<View />);
}

async function openSettings() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Configure Inspector' })
  );
  return screen.getByRole('dialog', { name: 'Inspector settings' });
}

it('shows an extension header and injected native host without importing the host into the domain', async () => {
  renderView();
  expect(await screen.findByText('Inspector')).toBeVisible();
  expect(screen.getByText('Version 1.0.0')).toBeVisible();
  expect(screen.getByText('Native host content')).toBeVisible();
  expect(screen.getByRole('link', { name: '← Extensions' })).toHaveAttribute(
    'href',
    '/extensions'
  );
});

it('opens gear settings with real configuration values and unchecked permissions without mutations', async () => {
  renderView();
  const dialog = await openSettings();
  expect(
    within(dialog).getByRole('table', {
      name: 'Current extension configuration',
    })
  ).toBeVisible();
  expect(within(dialog).getByText('Uploaded, not started')).toBeVisible();
  expect(within(dialog).getByText('linux-amd64')).not.toBeVisible();
  await userEvent.click(within(dialog).getByText('Package details'));
  expect(within(dialog).getByText('linux-amd64')).toBeVisible();
  for (const checkbox of within(dialog).getAllByRole('checkbox'))
    expect(checkbox).not.toBeChecked();
  expect(approveExtension).not.toHaveBeenCalled();
  expect(disableExtension).not.toHaveBeenCalled();
  expect(removeExtension).not.toHaveBeenCalled();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await openSettings();
  await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(approveExtension).not.toHaveBeenCalled();
});

it('requires a fresh explicit native trust acknowledgement before saving settings', async () => {
  renderView();
  const dialog = await openSettings();
  await userEvent.click(within(dialog).getByLabelText('Run native UI code'));
  expect(
    within(dialog).getByRole('button', { name: 'Save permission approval' })
  ).toBeDisabled();
  await userEvent.click(
    within(dialog).getByLabelText(
      'I trust this package to run code inside the Vessel console.'
    )
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save permission approval' })
  );
  await waitFor(() =>
    expect(approveExtension).toHaveBeenCalledWith(7, {
      revision: 3,
      trustedNativeUI: true,
      serviceReadEnabled: false,
      grants: [{ capability: 'ui.native', environmentIds: [] }],
    })
  );
});

it('disables and revokes only when the administrator presses the action', async () => {
  renderView();
  const dialog = await openSettings();
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Disable and revoke grants' })
  );
  await waitFor(() => expect(disableExtension).toHaveBeenCalledWith(7));
});

it('requires confirmation before removal and allows cancellation', async () => {
  renderView();
  const dialog = await openSettings();
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Remove extension' })
  );
  expect(removeExtension).not.toHaveBeenCalled();
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Cancel removal' })
  );
  expect(
    screen.queryByRole('group', { name: 'Confirm extension removal' })
  ).not.toBeInTheDocument();
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Remove extension' })
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Confirm removal' })
  );
  await waitFor(() => expect(removeExtension).toHaveBeenCalledWith(7));
});
