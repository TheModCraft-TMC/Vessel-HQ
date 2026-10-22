import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { ExtensionRecord } from '../../models/types';

import { PermissionReview } from './PermissionReview';

const extension: ExtensionRecord = {
  id: 1,
  manifest: {
    id: 'org.example.inspector',
    name: 'Inspector',
    version: '1.0.0',
    apiVersion: 'v1',
    packageDigest: `sha256:${'a'.repeat(64)}`,
    permissions: [
      { capability: 'ui.native', environmentIds: [] },
      { capability: 'containers.read', environmentIds: [1, 2] },
    ],
  },
  revision: 3,
  status: 'pending_approval',
  grants: [],
  trustedNativeUI: false,
  updatedAt: 1,
};

it('requires a separate trust acknowledgement before approving native UI', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={extension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );

  expect(
    screen
      .getAllByRole('checkbox')
      .every((checkbox) => !(checkbox as HTMLInputElement).checked)
  ).toBe(true);
  await user.click(screen.getByLabelText('Run native UI code'));
  expect(
    screen.getByRole('button', { name: 'Save permission approval' })
  ).toBeDisabled();
  expect(onApprove).not.toHaveBeenCalled();
  await user.click(
    screen.getByLabelText(
      'I trust this package to run code inside the Vessel console.'
    )
  );
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );

  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: true,
    serviceReadEnabled: false,
    grants: [{ capability: 'ui.native', environmentIds: [] }],
  });
});

it('approves only selected environment scopes and includes the reviewed revision', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={extension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );

  await user.click(screen.getByLabelText('containers.read — environment 2'));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );

  await waitFor(() =>
    expect(onApprove).toHaveBeenCalledWith({
      revision: 3,
      trustedNativeUI: false,
      serviceReadEnabled: false,
      grants: [{ capability: 'containers.read', environmentIds: [2] }],
    })
  );
});

it('does not reuse native trust when the native permission is deselected', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={extension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  await user.click(screen.getByLabelText('Run native UI code'));
  await user.click(
    screen.getByLabelText(
      'I trust this package to run code inside the Vessel console.'
    )
  );
  await user.click(screen.getByLabelText('Run native UI code'));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [],
  });
});

const serviceExtension: ExtensionRecord = {
  ...extension,
  serviceReadEnabled: true,
  manifest: {
    ...extension.manifest,
    permissions: [{ capability: 'environments.read', environmentIds: [1, 2] }],
  },
};
const serviceLabel =
  'Allow unattended read-only gRPC access to selected environments';

it('requires a new unchecked service access acknowledgement after selecting environment reads', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={serviceExtension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  expect(screen.queryByLabelText(serviceLabel)).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('environments.read — environment 2'));
  expect(screen.getByLabelText(serviceLabel)).not.toBeChecked();
  await user.click(screen.getByLabelText(serviceLabel));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: true,
    grants: [{ capability: 'environments.read', environmentIds: [2] }],
  });
});

it('clears unattended service approval when the environment scopes change', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={serviceExtension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  await user.click(screen.getByLabelText('environments.read — environment 1'));
  await user.click(screen.getByLabelText('environments.read — environment 2'));
  await user.click(screen.getByLabelText(serviceLabel));
  await user.click(screen.getByLabelText('environments.read — environment 1'));
  expect(screen.getByLabelText(serviceLabel)).not.toBeChecked();
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [{ capability: 'environments.read', environmentIds: [2] }],
  });
});

it('does not retain unattended access after all environment scopes are removed and reselected', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={serviceExtension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  await user.click(screen.getByLabelText('environments.read — environment 1'));
  await user.click(screen.getByLabelText(serviceLabel));
  await user.click(screen.getByLabelText('environments.read — environment 1'));
  expect(screen.queryByLabelText(serviceLabel)).not.toBeInTheDocument();
  await user.click(screen.getByLabelText('environments.read — environment 1'));
  expect(screen.getByLabelText(serviceLabel)).not.toBeChecked();
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [{ capability: 'environments.read', environmentIds: [1] }],
  });
});

const networkExtension: ExtensionRecord = {
  ...extension,
  manifest: {
    ...extension.manifest,
    permissions: [
      {
        capability: 'stacks.network.read',
        environmentIds: [1, 2],
        stackIds: [5, 6],
      },
    ],
  },
};

it('requires both explicit stack and environment selection for stack network access', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={networkExtension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  expect(
    screen
      .getAllByRole('checkbox')
      .every((checkbox) => !(checkbox as HTMLInputElement).checked)
  ).toBe(true);
  await user.click(
    screen.getByLabelText('stacks.network.read — environment 2')
  );
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenLastCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [],
  });
  await user.click(screen.getByLabelText('stacks.network.read — stack 6'));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenLastCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [
      { capability: 'stacks.network.read', environmentIds: [2], stackIds: [6] },
    ],
  });
});

it('does not approve a stack network scope without an environment', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(
    <PermissionReview
      extension={networkExtension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  await user.click(screen.getByLabelText('stacks.network.read — stack 5'));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 3,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [],
  });
});

it('requires independent selection of extension storage read and write grants', async () => {
  const user = userEvent.setup();
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const extension: ExtensionRecord = {
    id: 11,
    revision: 1,
    status: 'pending_approval',
    grants: [],
    trustedNativeUI: false,
    updatedAt: 1,
    manifest: {
      id: 'notes-demo',
      name: 'Notes',
      version: '1',
      apiVersion: 'v1',
      packageDigest: `sha256:${'a'.repeat(64)}`,
      permissions: [
        { capability: 'storage.read', environmentIds: [] },
        { capability: 'storage.write', environmentIds: [] },
      ],
    },
  };
  render(
    <PermissionReview
      extension={extension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  expect(
    screen.getByLabelText('Write this extension’s saved notes')
  ).not.toBeChecked();
  await user.click(screen.getByLabelText('Read this extension’s saved notes'));
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 1,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [{ capability: 'storage.read', environmentIds: [] }],
  });
});

it('requires explicit independent machine storage grants without native browser trust', async () => {
  const onApprove = vi.fn().mockResolvedValue(undefined);
  const extension: ExtensionRecord = {
    id: 12,
    revision: 1,
    status: 'pending_approval',
    grants: [],
    trustedNativeUI: false,
    updatedAt: 1,
    manifest: {
      id: 'service-notes',
      name: 'Service notes',
      version: '1',
      apiVersion: 'v1',
      packageDigest: `sha256:${'a'.repeat(64)}`,
      permissions: [
        { capability: 'storage.service.read', environmentIds: [] },
        { capability: 'storage.service.write', environmentIds: [] },
      ],
    },
  };
  render(
    <PermissionReview
      extension={extension}
      busy={false}
      onCancel={vi.fn()}
      onApprove={onApprove}
    />
  );
  const user = userEvent.setup();
  expect(
    screen.getByLabelText(
      'Allow the service to write its saved notes without a user session'
    )
  ).not.toBeChecked();
  await user.click(
    screen.getByLabelText(
      'Allow the service to read its saved notes without a user session'
    )
  );
  await user.click(
    screen.getByRole('button', { name: 'Save permission approval' })
  );
  expect(onApprove).toHaveBeenCalledWith({
    revision: 1,
    trustedNativeUI: false,
    serviceReadEnabled: false,
    grants: [{ capability: 'storage.service.read', environmentIds: [] }],
  });
});
