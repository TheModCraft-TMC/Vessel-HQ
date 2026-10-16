'use client';

import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useId,
  useRef,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Blocks, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';

import {
  useExtensionSlots,
  invokeStackExtension,
  watchStackTraffic,
  type ExtensionSlotRegistration,
} from '@/domains/extensions';
import { ButtonWithRef } from '@/ui/components/buttons';
import { Widget, WidgetBody, WidgetTitle } from '@/ui/components/Widget';

import { nativeExtensionRegistrations } from './generated/registrations';
import type { NativeExtensionRegistration } from './types';
import type {
  NativeExtensionProps,
  StackDetailContext,
  StackTrafficOverview,
} from './sdk';

const actionSlot = 'docker.stack.detail.action';

/** Slot metadata comes from the authenticated host, never the extension bundle. */
export function StackDetailExtensionActions({
  context,
}: {
  context: StackDetailContext;
}) {
  const query = useExtensionSlots(context.environmentId, context.stackId);
  if (query.isFetching || query.isError || !query.data?.length) return null;
  const actions = query.data.flatMap((record) => {
    const registration = nativeExtensionRegistrations.find(
      (item) =>
        item.id === record.manifest.id &&
        item.packageDigest === record.manifest.packageDigest &&
        item.uiEntry === record.manifest.ui.entry
    );
    if (!registration) return [];
    return record.manifest.ui.slots
      .filter(
        (slot) =>
          slot.slot === actionSlot &&
          registration.slots?.some(
            (built) =>
              built.id === slot.id &&
              built.slot === actionSlot &&
              built.title === slot.title
          )
      )
      .map((slot) => (
        <ExtensionAction
          key={`${record.id}:${record.revision}:${slot.id}:${context.environmentId}:${context.stackId}`}
          record={record}
          registration={registration}
          title={slot.title}
          context={context}
        />
      ));
  });
  if (!actions.length) return null;
  return (
    <div className="row">
      <div className="col-sm-12 space-y-4">{actions}</div>
    </div>
  );
}

class ExtensionBoundary extends Component<
  NativeExtensionProps & { registration: NativeExtensionRegistration },
  { failed: boolean }
> {
  state = { failed: false };

  private View;

  constructor(
    props: NativeExtensionProps & { registration: NativeExtensionRegistration }
  ) {
    super(props);
    this.View = lazy(props.registration.load);
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    const { View } = this;
    const { context, invoke, watchTraffic } = this.props;
    const { failed } = this.state;
    if (failed)
      return (
        <p role="alert">
          The extension could not render. Close the drawer or refresh to try
          again.
        </p>
      );
    return (
      <Suspense fallback={<p role="status">Loading extension…</p>}>
        <View context={context} invoke={invoke} watchTraffic={watchTraffic} />
      </Suspense>
    );
  }
}

function ExtensionAction({
  record,
  registration,
  title,
  context,
}: {
  record: ExtensionSlotRegistration;
  registration: NativeExtensionRegistration;
  title: string;
  context: StackDetailContext;
}) {
  const { environmentId, stackId, stackName } = context;
  const scopedContext = useMemo(
    () => Object.freeze({ environmentId, stackId, stackName }),
    [environmentId, stackId, stackName]
  );
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    function escape(event: KeyboardEvent) {
      if (
        event.key === 'Escape' &&
        card.current?.contains(document.activeElement)
      )
        close();
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open, close]);
  const [generation, setGeneration] = useState(0);
  const client = useQueryClient();
  const invoke = useCallback<NativeExtensionProps['invoke']>(
    <T,>(
      operation: 'stacks.network.read' | 'stacks.traffic.read',
      input: { environmentId: number; stackId: number }
    ) => {
      const scopedInput = {
        environmentId: input.environmentId,
        stackId: input.stackId,
      };
      if (
        !['stacks.network.read', 'stacks.traffic.read'].includes(operation) ||
        scopedInput.environmentId !== environmentId ||
        scopedInput.stackId !== stackId
      ) {
        return Promise.reject(
          new Error('Extension request is outside the current stack.')
        );
      }
      return client.fetchQuery<T>({
        queryKey: [
          'native-extensions',
          'invoke',
          record.id,
          record.revision,
          record.manifest.packageDigest,
          operation,
          scopedInput.environmentId,
          scopedInput.stackId,
        ],
        queryFn: () =>
          invokeStackExtension<T>(record.id, operation, scopedInput, {
            revision: record.revision,
            packageDigest: record.manifest.packageDigest,
          }),
        staleTime: 0,
        cacheTime: 0,
        retry: false,
      });
    },
    [client, record, environmentId, stackId]
  );

  const watchTraffic = useCallback<
    NonNullable<NativeExtensionProps['watchTraffic']>
  >(
    (onSnapshot, signal) =>
      watchStackTraffic<StackTrafficOverview>(
        record.id,
        scopedContext,
        {
          revision: record.revision,
          packageDigest: record.manifest.packageDigest,
        },
        (snapshot) => {
          if (
            snapshot.environmentId !== environmentId ||
            snapshot.stackId !== stackId
          )
            throw new Error('Traffic response is outside the current stack.');
          onSnapshot(snapshot);
        },
        signal
      ),
    [record, scopedContext, environmentId, stackId]
  );

  return (
    <Widget mRef={card} aria-label={`${title} extension`}>
      <WidgetTitle
        title={
          <ButtonWithRef
            ref={trigger}
            icon={open ? ChevronUp : ChevronDown}
            color="none"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen((value) => !value)}
            data-cy={`extension-action-${record.manifest.id}`}
          >
            {title}
          </ButtonWithRef>
        }
        icon={Blocks}
      >
        {open && (
          <div className="flex gap-2">
            <ButtonWithRef
              icon={RefreshCw}
              color="default"
              onClick={() => setGeneration((value) => value + 1)}
              aria-label="Refresh drawer content"
              data-cy="extension-drawer-refresh"
            />
            <ButtonWithRef
              icon={X}
              color="default"
              onClick={close}
              aria-label="Close"
              data-cy="extension-drawer-close"
            />
          </div>
        )}
      </WidgetTitle>
      {open && (
        <WidgetBody>
          <section id={drawerId} ref={drawer} aria-label={`${title} drawer`}>
            <ExtensionBoundary
              key={generation}
              registration={registration}
              context={scopedContext}
              invoke={invoke}
              watchTraffic={watchTraffic}
            />
          </section>
        </WidgetBody>
      )}
    </Widget>
  );
}
