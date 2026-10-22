export interface ExtensionPermission {
  capability:
    | 'ui.native'
    | 'storage.read'
    | 'storage.write'
    | 'storage.service.read'
    | 'storage.service.write'
    | 'environments.read'
    | 'containers.read'
    | 'stacks.read'
    | 'stacks.network.read'
    | 'stacks.traffic.read';
  environmentIds: number[];
  stackIds?: number[];
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  apiVersion: 'v1';
  packageDigest: string;
  permissions: ExtensionPermission[];
  ui?: {
    entry: string;
    slots: {
      id: string;
      title: string;
      slot: 'extension.page' | 'docker.stack.detail.action';
    }[];
  };
  backend?: {
    type: 'executable';
    entrypoints: Partial<Record<'linux-amd64' | 'linux-arm64', string>>;
  };
}

export interface ExtensionRecord {
  id: number;
  manifest: ExtensionManifest;
  revision: number;
  status: 'pending_approval' | 'approved' | 'disabled';
  grants: ExtensionPermission[];
  trustedNativeUI: boolean;
  serviceReadEnabled?: boolean;
  packageAvailable?: boolean;
  archiveDigest?: string;
  updatedAt: number;
}

export interface ExtensionApproval {
  revision: number;
  trustedNativeUI: boolean;
  serviceReadEnabled: boolean;
  grants: ExtensionPermission[];
}
