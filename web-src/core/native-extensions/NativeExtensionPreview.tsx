'use client';

import {
  Component,
  lazy,
  Suspense,
  useSyncExternalStore,
  useMemo,
  type ComponentType,
} from 'react';

import { useIsPureAdmin } from '@/core/session/useUser';
import { extensionStorage, useNativeExtensions } from '@/domains/extensions';

import { nativeExtensionRegistrations } from './generated/registrations';
import type { NativeExtensionRegistration } from './types';
import type { NativeExtensionStorage } from './sdk';
import { useVerifiedExtensionData } from './useVerifiedExtensionData';
import { useRuntimeWatchdog } from './useRuntimeWatchdog';
import type { RuntimeWatchdog } from './runtime-watchdog';

function subscribeToBrowser() {
  return () => undefined;
}
function browserSnapshot() {
  return true;
}
function serverSnapshot() {
  return false;
}

class PreviewBoundary extends Component<
  {
    registration: NativeExtensionRegistration;
    storage: NativeExtensionStorage;
    watchdog?: RuntimeWatchdog;
  },
  { failed: boolean }
> {
  state = { failed: false };

  private Preview;

  constructor(props: {
    registration: NativeExtensionRegistration;
    storage: NativeExtensionStorage;
  }) {
    super(props);
    this.Preview = lazy(async () => {
      const module = await props.registration.load();
      return {
        default: module.default as ComponentType<{
          storage: NativeExtensionStorage;
        }>,
      };
    });
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    const { watchdog } = this.props;
    watchdog?.trip('render-error');
  }

  render() {
    const { failed } = this.state;
    const { Preview } = this;
    const { storage } = this.props;
    if (failed) {
      return (
        <p role="alert">
          Extension preview failed. Return to Extensions to disable it.
        </p>
      );
    }
    return (
      <Suspense fallback={<p>Loading extension…</p>}>
        <Preview storage={storage} />
      </Suspense>
    );
  }
}

export function NativeExtensionPreview({
  extensionId,
}: {
  extensionId: string;
}) {
  const isAdmin = useIsPureAdmin();
  const isBrowser = useSyncExternalStore(
    subscribeToBrowser,
    browserSnapshot,
    serverSnapshot
  );
  if (!isAdmin) {
    return (
      <p role="alert">Only administrators can preview native extensions.</p>
    );
  }
  if (!isBrowser) return <p>Preparing extension preview…</p>;
  return <ApprovedPreview key={extensionId} extensionId={extensionId} />;
}

function ApprovedPreview({ extensionId }: { extensionId: string }) {
  const query = useNativeExtensions();
  const verifiedData = useVerifiedExtensionData(query);
  const record = verifiedData?.find((item) => item.manifest.id === extensionId);
  const registration = nativeExtensionRegistrations.find(
    (item) => item.id === extensionId
  );
  const id = record?.id ?? 0;
  const revision = record?.revision ?? 0;
  const packageDigest = record?.manifest.packageDigest ?? '';
  const updatedAt = record?.updatedAt ?? 0;
  const binding = useMemo(
    () => (id ? { id, revision, packageDigest, updatedAt } : undefined),
    [id, revision, packageDigest, updatedAt]
  );
  const { guard, state: safety } = useRuntimeWatchdog(
    binding,
    'preview',
    !!record &&
      record.status === 'approved' &&
      record.trustedNativeUI &&
      registration?.packageDigest === record.manifest.packageDigest &&
      !registration?.slots?.some(
        (slot) => slot.slot === 'docker.stack.detail.action'
      )
  );
  const storage = useMemo(
    () => guardStorage(extensionStorage(id, revision, packageDigest), guard),
    [id, revision, packageDigest, guard]
  );
  const allowed =
    !query.isError &&
    record?.status === 'approved' &&
    record.trustedNativeUI &&
    record.manifest.permissions.some((p) => p.capability === 'ui.native') &&
    record.grants.some((p) => p.capability === 'ui.native') &&
    registration?.packageDigest === record.manifest.packageDigest &&
    registration?.uiEntry === record.manifest.ui?.entry;

  if (query.isLoading || (query.isFetching && !verifiedData))
    return <p>Checking current approval…</p>;
  if (query.isError) {
    return (
      <p role="alert">Unable to verify extension approval. Preview blocked.</p>
    );
  }
  if (!registration) {
    return <p>This extension is not included in this console build.</p>;
  }
  if (
    registration.slots?.some(
      (slot) => slot.slot === 'docker.stack.detail.action'
    )
  ) {
    return (
      <p>This extension opens from the details of an approved Docker stack.</p>
    );
  }
  if (!allowed) {
    return (
      <p role="alert">
        Preview requires administrator approval for this exact package and its
        native UI permission.
      </p>
    );
  }
  if (safety.reason)
    return (
      <p role="alert">
        Extension stopped by its safety guard ({safety.reason}).{' '}
        {safety.reportFailed
          ? 'Server revocation failed; disable it in extension settings.'
          : safety.disabled
            ? 'Permissions revoked. Review settings before approving again.'
            : 'Revoking extension permissions…'}
      </p>
    );
  return (
    <>
      <p role="status">
        Native extension preview. Infrastructure runtime access is unavailable.
        This code is trusted to run in your console browser context.
      </p>
      <PreviewBoundary
        key={`${extensionId}:${record?.revision}`}
        registration={registration}
        storage={storage}
        watchdog={guard}
      />
    </>
  );
}

function guardStorage(
  storage: NativeExtensionStorage,
  guard?: RuntimeWatchdog
): NativeExtensionStorage {
  return {
    read: () => (guard ? guard.run(() => storage.read()) : storage.read()),
    write: (note) =>
      guard ? guard.run(() => storage.write(note)) : storage.write(note),
  };
}
