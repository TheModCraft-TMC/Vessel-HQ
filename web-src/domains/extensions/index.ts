export { ExtensionsView } from './views/ExtensionsView/ExtensionsView';
export { ExtensionDetailsView } from './views/ExtensionDetailsView/ExtensionDetailsView';
export { useExtensions as useNativeExtensions } from './queries/useExtensions';
export { useExtensionSlots } from './queries/useExtensionSlots';
export { invokeStackExtension, watchStackTraffic } from './services/slots.service';
export type { ExtensionSlotRegistration } from './services/slots.service';
export type {
  ExtensionManifest,
  ExtensionPermission,
  ExtensionRecord,
} from './models/types';

export { extensionStorage } from './services/storage.service';
