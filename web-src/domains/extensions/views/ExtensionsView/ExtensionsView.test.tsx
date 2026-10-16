import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { useIsPureAdmin } from '@/core/session/useUser';

import {
  getExtensions,
  uploadExtension,
  approveExtension,
} from '../../services/extensions.service';

import { ExtensionsView } from './ExtensionsView';

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
        version: '1.0.0',
        apiVersion: 'v1',
        packageDigest: `sha256:${'a'.repeat(64)}`,
        permissions: [],
      },
      revision: 1,
      status: 'approved',
      grants: [],
      trustedNativeUI: false,
      updatedAt: 1,
    },
  ]);
});

function renderView() {
  const View = withTestQueryProvider(ExtensionsView);
  render(<View />);
}

it('blocks administration for non-administrators before fetching manifests', () => {
  vi.mocked(useIsPureAdmin).mockReturnValue(false);
  renderView();
  expect(
    screen.getByText('Only administrators can manage native extensions.')
  ).toBeVisible();
  expect(screen.queryByLabelText('Manifest JSON')).not.toBeInTheDocument();
  expect(getExtensions).not.toHaveBeenCalled();
});

it('links compact extension cards to their dedicated native page', async () => {
  renderView();
  const card = await screen.findByRole('link', { name: 'Open Inspector' });
  expect(card).toHaveAttribute('href', '/extensions/org.example.inspector');
  expect(screen.getByText('1.0.0')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Disable and revoke grants' })
  ).not.toBeInTheDocument();
});

it('opens the package chooser from the add extension tile', async () => {
  renderView();
  expect(screen.queryByText('Upload an extension')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Upload package' })
  ).not.toBeInTheDocument();
  const input = screen.getByLabelText('Extension package');
  const click = vi.spyOn(input, 'click');
  await userEvent.click(
    screen.getByRole('button', { name: 'Add extension package' })
  );
  expect(click).toHaveBeenCalledOnce();
});

it('uploads packages without automatically granting any permission', async () => {
  vi.mocked(uploadExtension).mockResolvedValue({
    id: 9,
    manifest: {
      id: 'org.example.uploaded',
      name: 'Uploaded',
      version: '1.0.0',
      apiVersion: 'v1',
      packageDigest: `sha256:${'b'.repeat(64)}`,
      permissions: [],
    },
    revision: 1,
    status: 'pending_approval',
    grants: [],
    trustedNativeUI: false,
    packageAvailable: true,
    updatedAt: 1,
  });
  renderView();
  const file = new File(['archive'], 'uploaded.vesselhq', {
    type: 'application/zip',
  });
  await userEvent.upload(screen.getByLabelText('Extension package'), file);
  expect(screen.getByText('uploaded.vesselhq · 0.0 KiB')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Upload package' })).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Upload package' }));
  await waitFor(() =>
    expect(uploadExtension).toHaveBeenCalledWith(file, expect.any(AbortSignal))
  );
  expect(approveExtension).not.toHaveBeenCalled();
  expect(
    await screen.findByText(/Package uploaded. Review its permissions/)
  ).toBeVisible();
});
