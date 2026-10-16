import type { ComponentType } from 'react';

import type { NativeExtensionProps } from './sdk';

export interface NativeExtensionRegistration {
  id: string;
  packageDigest: string;
  uiEntry?: string;
  slots?: { id: string; title: string; slot: string }[];
  load: () => Promise<{ default: ComponentType<NativeExtensionProps> }>;
}
