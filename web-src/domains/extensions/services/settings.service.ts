import axios, { isAxiosError } from '@/shared/http';

import type { ExtensionRecord } from '../models/types';

export interface ExtensionSettings {
  version: number;
  values: Record<string, string>;
  secretKeys: string[];
}

export interface SettingsUpdate {
  version: number;
  values: Record<string, string>;
  secrets: Record<string, string | null>;
}

// Never retain Axios errors: request config may contain secret input.
export class SettingsError extends Error {
  constructor(public readonly conflict: boolean) {
    super(
      conflict
        ? 'The extension or its settings changed. Reload settings before trying again.'
        : 'Unable to update settings. Check your access and connection, then reload settings.'
    );
    this.name = 'SettingsError';
  }
}

function sanitizedError(error: unknown) {
  return new SettingsError(
    isAxiosError(error) && error.response?.status === 409
  );
}

export function extensionSettings(extension: ExtensionRecord) {
  const path = `/native-extensions/${extension.id}/settings`;
  const identity = {
    revision: extension.revision,
    packageDigest: extension.manifest.packageDigest,
  };
  return {
    async read(signal?: AbortSignal): Promise<ExtensionSettings> {
      try {
        return (
          await axios.get<ExtensionSettings>(path, { params: identity, signal })
        ).data;
      } catch (error) {
        throw sanitizedError(error);
      }
    },
    async update(input: SettingsUpdate): Promise<ExtensionSettings> {
      try {
        return (
          await axios.put<ExtensionSettings>(path, { ...identity, ...input })
        ).data;
      } catch (error) {
        throw sanitizedError(error);
      }
    },
    async reset(version: number): Promise<ExtensionSettings> {
      try {
        return (
          await axios.delete<ExtensionSettings>(path, {
            data: { ...identity, version },
          })
        ).data;
      } catch (error) {
        throw sanitizedError(error);
      }
    },
  };
}
