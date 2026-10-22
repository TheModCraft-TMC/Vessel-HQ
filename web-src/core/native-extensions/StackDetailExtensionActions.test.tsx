import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import {
  invokeStackExtension,
  useExtensionSlots,
  type ExtensionSlotRegistration,
} from '@/domains/extensions';

import { nativeExtensionRegistrations } from './generated/registrations';
import type { NativeExtensionProps } from './sdk';
import { StackDetailExtensionActions } from './StackDetailExtensionActions';

vi.mock('@/domains/extensions', () => ({
  useExtensionSlots: vi.fn(),
  invokeStackExtension: vi.fn(),
}));
vi.mock('./generated/registrations', () => ({
  nativeExtensionRegistrations: [],
}));

const context = { environmentId: 2, stackId: 5, stackName: 'shop' };
const digest = `sha256:${'a'.repeat(64)}`;
const slot = {
  id: 'network-overview',
  title: 'Network overview',
  slot: 'docker.stack.detail.action',
};
const record: ExtensionSlotRegistration = {
  id: 4,
  revision: 2,
  manifest: {
    id: 'stack-network-overview',
    name: 'Stack networks',
    packageDigest: digest,
    ui: { entry: 'ui/index.tsx', slots: [slot] },
  },
};
const load = vi.fn();

function TestExtension({ context: scoped, invoke }: NativeExtensionProps) {
  const [message, setMessage] = useState('');
  function call(
    operation: 'stacks.network.read',
    input: { environmentId: number; stackId: number }
  ) {
    void invoke<{ name: string }>(operation, input)
      .then((data) => setMessage(`Broker result: ${data.name}`))
      .catch((error: Error) => setMessage(error.message));
  }
  return (
    <div>
      <p>Host scope frozen: {String(Object.isFrozen(scoped))}</p>
      <p>
        Extension scope {scoped.environmentId}:{scoped.stackId}:
        {scoped.stackName}
      </p>
      <button
        type="button"
        onClick={() =>
          call('stacks.network.read', {
            environmentId: scoped.environmentId,
            stackId: scoped.stackId,
          })
        }
      >
        Read current stack
      </button>
      <button
        type="button"
        onClick={() =>
          call('stacks.network.read', { ...scoped, environmentId: 99 })
        }
      >
        Read other environment
      </button>
      <button
        type="button"
        onClick={() => call('stacks.network.read', { ...scoped, stackId: 99 })}
      >
        Read other stack
      </button>
      <button
        type="button"
        onClick={() => call('stacks.write' as 'stacks.network.read', scoped)}
      >
        Call forbidden operation
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

function setQuery(data: ExtensionSlotRegistration[], overrides: object = {}) {
  vi.mocked(useExtensionSlots).mockReturnValue({
    data,
    isFetching: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof useExtensionSlots>);
}

beforeEach(() => {
  vi.clearAllMocks();
  load.mockResolvedValue({ default: TestExtension });
  nativeExtensionRegistrations.splice(0, nativeExtensionRegistrations.length, {
    id: record.manifest.id,
    packageDigest: digest,
    uiEntry: 'ui/index.tsx',
    slots: [slot],
    load,
  });
  setQuery([record]);
  vi.mocked(invokeStackExtension).mockResolvedValue({ name: 'shop' });
});

function renderActions() {
  const View = withTestQueryProvider(StackDetailExtensionActions);
  const view = render(<View context={context} />);
  return { rerender: () => view.rerender(<View context={context} />) };
}

it('does not load unapproved or unavailable extensions absent from authorized slots', () => {
  setQuery([]);
  renderActions();
  expect(useExtensionSlots).toHaveBeenCalledWith(2, 5);
  expect(
    screen.queryByRole('button', { name: 'Network overview' })
  ).not.toBeInTheDocument();
  expect(load).not.toHaveBeenCalled();
});

it.each(['digest', 'slot id', 'slot title', 'slot kind'] as const)(
  'blocks a mismatched %s before any extension code loads',
  (mismatch) => {
    const registration = nativeExtensionRegistrations[0];
    if (mismatch === 'digest')
      registration.packageDigest = `sha256:${'b'.repeat(64)}`;
    else
      registration.slots = [
        {
          ...slot,
          ...(mismatch === 'slot id'
            ? { id: 'other' }
            : mismatch === 'slot title'
              ? { title: 'Unapproved action' }
              : { slot: 'extension.page' }),
        },
      ];
    renderActions();
    expect(
      screen.queryByRole('button', { name: 'Network overview' })
    ).not.toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
  }
);

it('loads matching code only when the action opens the inline stack drawer', async () => {
  renderActions();
  expect(load).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Network overview' })
  );
  expect(await screen.findByText('Extension scope 2:5:shop')).toBeVisible();
  expect(screen.getByText('Host scope frozen: true')).toBeVisible();
  const sheet = screen.getByRole('region', { name: 'Network overview drawer' });
  expect(
    screen.getByRole('region', { name: 'Network overview extension' })
  ).toContainElement(sheet);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(load).toHaveBeenCalledOnce();
  expect(invokeStackExtension).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(
    screen.queryByRole('region', { name: 'Network overview drawer' })
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Network overview' })
    ).toHaveFocus()
  );
});

it('sends a matching operation through the permission-checked host broker with the exact context', async () => {
  renderActions();
  await userEvent.click(
    screen.getByRole('button', { name: 'Network overview' })
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Read current stack' })
  );
  expect(await screen.findByText('Broker result: shop')).toBeVisible();
  expect(invokeStackExtension).toHaveBeenCalledExactlyOnceWith(
    4,
    'stacks.network.read',
    { environmentId: 2, stackId: 5 },
    { revision: record.revision, packageDigest: digest }
  );
});

it.each([
  'Read other environment',
  'Read other stack',
  'Call forbidden operation',
])('rejects %s before reaching the broker', async (action) => {
  renderActions();
  await userEvent.click(
    screen.getByRole('button', { name: 'Network overview' })
  );
  await userEvent.click(await screen.findByRole('button', { name: action }));
  expect(
    await screen.findByText('Extension request is outside the current stack.')
  ).toBeVisible();
  expect(invokeStackExtension).not.toHaveBeenCalled();
});

it.each(['revoked', 'refetching', 'refetch error'] as const)(
  'removes an open extension when authorization is %s',
  async (reason) => {
    const view = renderActions();
    await userEvent.click(
      screen.getByRole('button', { name: 'Network overview' })
    );
    await screen.findByText('Extension scope 2:5:shop');
    setQuery(
      reason === 'revoked' ? [] : [record],
      reason === 'refetching'
        ? { isFetching: true }
        : reason === 'refetch error'
          ? { isError: true }
          : {}
    );
    view.rerender();
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Network overview drawer' })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.queryByRole('button', { name: 'Network overview' })
    ).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledOnce();
  }
);

it('contains a failed bundle and retries only when the drawer refresh is requested', async () => {
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  try {
    load.mockRejectedValueOnce(new Error('Bundle unavailable'));
    renderActions();
    await userEvent.click(
      screen.getByRole('button', { name: 'Network overview' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The extension could not render'
    );
    expect(invokeStackExtension).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh drawer content' })
    );
    expect(await screen.findByText('Extension scope 2:5:shop')).toBeVisible();
    expect(load).toHaveBeenCalledTimes(2);
  } finally {
    consoleError.mockRestore();
  }
});

it('rejects a compiled entry mismatch even when package digest and slot match', () => {
  nativeExtensionRegistrations[0].uiEntry = 'ui/other.tsx';
  renderActions();
  expect(
    screen.queryByRole('button', { name: 'Network overview' })
  ).not.toBeInTheDocument();
  expect(load).not.toHaveBeenCalled();
});

it('closes on Escape from the extension card header and restores trigger focus', async () => {
  renderActions();
  await userEvent.click(
    screen.getByRole('button', { name: 'Network overview' })
  );
  await screen.findByText('Extension scope 2:5:shop');
  screen.getByRole('button', { name: 'Close' }).focus();
  await userEvent.keyboard('{Escape}');
  expect(
    screen.queryByRole('region', { name: 'Network overview drawer' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Network overview' })
  ).toHaveFocus();
});
