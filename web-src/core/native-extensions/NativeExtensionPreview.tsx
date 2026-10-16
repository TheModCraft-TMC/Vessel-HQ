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
  const record = query.data?.find((item) => item.manifest.id === extensionId);
  const registration = nativeExtensionRegistrations.find(
    (item) => item.id === extensionId
  );
  const storage = useMemo(
    () =>
      extensionStorage(
        record?.id ?? 0,
        record?.revision ?? 0,
        record?.manifest.packageDigest ?? ''
      ),
    [record?.id, record?.revision, record?.manifest.packageDigest]
  );
  const allowed =
    !query.isFetching &&
    !query.isError &&
    record?.status === 'approved' &&
    record.trustedNativeUI &&
    record.manifest.permissions.some((p) => p.capability === 'ui.native') &&
    record.grants.some((p) => p.capability === 'ui.native') &&
    registration?.packageDigest === record.manifest.packageDigest &&
    registration?.uiEntry === record.manifest.ui?.entry;

  if (query.isLoading || query.isFetching)
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
      />
    </>
  );
}
