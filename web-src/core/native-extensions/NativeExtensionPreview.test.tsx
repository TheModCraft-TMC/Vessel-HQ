import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { useIsPureAdmin } from '@/core/session/useUser';
import {
  useNativeExtensions,
  type ExtensionRecord,
} from '@/domains/extensions';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';

import { nativeExtensionRegistrations } from './generated/registrations';
import { NativeExtensionPreview as NativeExtensionPreviewComponent } from './NativeExtensionPreview';

let NativeExtensionPreview = withTestQueryProvider(
  NativeExtensionPreviewComponent
);

vi.mock('@/core/session/useUser', () => ({ useIsPureAdmin: vi.fn() }));
vi.mock('@/domains/extensions', () => ({
  useNativeExtensions: vi.fn(),
  extensionStorage: vi.fn(() => ({ read: vi.fn(), write: vi.fn() })),
  tripExtensionRuntime: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./generated/registrations', () => ({
  nativeExtensionRegistrations: [],
}));

const digest = `sha256:${'a'.repeat(64)}`;
const extensionId = 'org.example.inspector';
const load = vi.fn();

function record(overrides: Partial<ExtensionRecord> = {}): ExtensionRecord {
  return {
    id: 1,
    manifest: {
      id: extensionId,
      name: 'Inspector',
      version: '1.0.0',
      apiVersion: 'v1',
      packageDigest: digest,
      permissions: [{ capability: 'ui.native', environmentIds: [] }],
      ui: {
        entry: 'ui/index.tsx',
        slots: [{ id: 'overview', title: 'Inspector', slot: 'extension.page' }],
      },
    },
    revision: 1,
    status: 'approved',
    grants: [{ capability: 'ui.native', environmentIds: [] }],
    trustedNativeUI: true,
    updatedAt: 1,
    ...overrides,
  };
}

function setQuery(records: ExtensionRecord[], extra: object = {}) {
  vi.mocked(useNativeExtensions).mockReturnValue({
    data: records,
    isLoading: false,
    isFetching: false,
    isError: false,
    ...extra,
  } as ReturnType<typeof useNativeExtensions>);
}

beforeEach(() => {
  sessionStorage.clear();
  NativeExtensionPreview = withTestQueryProvider(
    NativeExtensionPreviewComponent
  );
  vi.clearAllMocks();
  vi.mocked(useIsPureAdmin).mockReturnValue(true);
  load.mockResolvedValue({
    default: () => <div>Inspector native content</div>,
  });
  nativeExtensionRegistrations.splice(0, nativeExtensionRegistrations.length, {
    id: extensionId,
    packageDigest: digest,
    uiEntry: 'ui/index.tsx',
    load,
  });
  setQuery([record()]);
});

afterEach(() => vi.restoreAllMocks());

it('does not fetch approvals or load extension code for non-administrators', () => {
  vi.mocked(useIsPureAdmin).mockReturnValue(false);
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Only administrators');
  expect(useNativeExtensions).not.toHaveBeenCalled();
  expect(load).not.toHaveBeenCalled();
});

it.each([
  ['pending approval', { status: 'pending_approval' }],
  ['disabled', { status: 'disabled' }],
  ['missing native grant', { grants: [] }],
  ['missing native trust', { trustedNativeUI: false }],
] as const)('never loads code when %s', (_reason, overrides) => {
  setQuery([record(overrides as Partial<ExtensionRecord>)]);
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Preview requires administrator approval'
  );
  expect(load).not.toHaveBeenCalled();
});

it('never loads a compiled package whose digest differs from the approval', () => {
  nativeExtensionRegistrations[0].packageDigest = `sha256:${'b'.repeat(64)}`;
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Preview requires administrator approval'
  );
  expect(load).not.toHaveBeenCalled();
});

it('loads matching code only after native UI approval and trust', async () => {
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(await screen.findByText('Inspector native content')).toBeVisible();
  expect(load).toHaveBeenCalledOnce();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Infrastructure runtime access is unavailable'
  );
});

it('blocks cached approval if verification refetch fails', () => {
  setQuery([record()], { isError: true });
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Unable to verify extension approval'
  );
  expect(load).not.toHaveBeenCalled();
});

it('blocks cached approval while verification is in flight', () => {
  setQuery([record()], { isFetching: true });
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByText('Checking current approval…')).toBeVisible();
  expect(load).not.toHaveBeenCalled();
});

it('retains an already verified editor during background approval refresh and stops on revocation', async () => {
  const data = [record()];
  setQuery(data);
  load.mockResolvedValue({
    default: () => <input aria-label="Draft" defaultValue="" />,
  });
  const view = render(<NativeExtensionPreview extensionId={extensionId} />);
  const editor = await screen.findByRole('textbox', { name: 'Draft' });
  fireEvent.change(editor, { target: { value: 'unsaved text' } });
  setQuery(data, { isFetching: true });
  view.rerender(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(editor);
  expect(editor).toHaveValue('unsaved text');
  expect(load).toHaveBeenCalledOnce();
  setQuery([record({ status: 'disabled' })]);
  view.rerender(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('stops and revokes an extension when loading the bundle fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  load.mockRejectedValue(new Error('Candidate bundle unavailable'));
  await act(async () => {
    render(<NativeExtensionPreview extensionId={extensionId} />);
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Extension stopped by its safety guard'
  );
});

it('shows a recovery message when extension rendering fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  load.mockResolvedValue({
    default: () => {
      throw new Error('Extension render failed');
    },
  });
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Extension stopped by its safety guard'
  );
});

it('never loads a component compiled from a different entry with the same source digest', () => {
  nativeExtensionRegistrations[0].uiEntry = 'ui/other.tsx';
  render(<NativeExtensionPreview extensionId={extensionId} />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Preview requires administrator approval'
  );
  expect(load).not.toHaveBeenCalled();
});
