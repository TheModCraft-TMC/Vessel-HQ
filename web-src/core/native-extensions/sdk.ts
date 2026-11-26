/** Native UI receives only host-scoped context and the permission-checked broker. */
export interface StackDetailContext {
  environmentId: number;
  stackId: number;
  stackName: string;
}

export interface ExtensionNote {
  text: string;
  version: number;
}

export interface NativeExtensionStorage {
  read(): Promise<ExtensionNote>;
  write(note: ExtensionNote): Promise<ExtensionNote>;
}

export interface NativeExtensionProps {
  watchTraffic?(
    onSnapshot: (snapshot: StackTrafficOverview) => void,
    signal: AbortSignal
  ): Promise<void>;
  storage?: NativeExtensionStorage;
  context: Readonly<StackDetailContext>;
  invoke<T>(
    operation:
      | 'stacks.network.read'
      | 'stacks.traffic.read'
      | 'stacks.delivery.read'
      | 'stacks.gitops.sync'
      | 'stacks.images.read'
      | 'stacks.images.update'
      | 'stacks.images.configure',
    input: {
      environmentId: number;
      stackId: number;
      version?: string;
      automation?: {
        version: number;
        enabled: boolean;
        mode: 'monitor-only' | 'automatic';
        intervalMinutes: number;
      };
    }
  ): Promise<T>;
}

export interface StackNetworkOverview {
  stackId: number;
  environmentId: number;
  name: string;
  networks: {
    id: string;
    name: string;
    driver: string;
    scope: string;
    internal: boolean;
  }[];
  workloads: {
    id: string;
    name: string;
    kind: 'container' | 'service';
    state?: string;
    networks: { networkId: string }[];
  }[];
}

export interface StackTrafficOverview extends StackNetworkOverview {
  traffic: {
    collectedAt: string;
    routers: {
      id: string;
      protocol: string;
      workloadId: string;
      rule: string;
      service: string;
      entryPoints: string[];
      middlewares: string[];
      tls: boolean;
    }[];
    services: {
      id: string;
      protocol: string;
      workloadId: string;
      port: number;
      scheme: string;
    }[];
    middlewares: {
      id: string;
      protocol: string;
      workloadId: string;
      types: string[];
      settings: Record<string, string>;
      redacted: boolean;
    }[];
    counters: {
      workloadId: string;
      receivedBytes: string;
      sentBytes: string;
      available: boolean;
      reason: string;
    }[];
    warnings: string[];
  };
}

/** Administrator-only host projection. No credentials, Compose text or environment values. */
export interface StackDeliverySnapshot {
  automation?: {
    version: number;
    enabled: boolean;
    mode: 'monitor-only' | 'automatic';
    intervalMinutes: number;
    environmentId: number;
    stackId: number;
    lastCheck: number;
    lastOutcome: string;
  };
  environmentId: number;
  stackId: number;
  name: string;
  version: string;
  status: number;
  workflowId: number;
  updatedAt: number;
  deployedRevision: string;
  syncStatus: 'unknown' | 'unmanaged' | 'synced' | 'out-of-sync';
  automaticSync: boolean;
  repullOnSync: boolean;
  sources: {
    id: number;
    name: string;
    ref: string;
    path: string;
    desiredRevision: string;
    status: number;
    interval: string;
  }[];
  images: {
    workloadId: string;
    name: string;
    kind: string;
    reference: string;
    policy: 'manual' | 'monitor-only' | 'excluded';
    status: string;
  }[];
}
