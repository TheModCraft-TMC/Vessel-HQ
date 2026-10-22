import axios, { parseAxiosError } from '@/shared/http';

import type {
  ExtensionApproval,
  ExtensionManifest,
  ExtensionRecord,
} from '../models/types';

const base = '/native-extensions';

export async function getExtensions() {
  try {
    return (await axios.get<ExtensionRecord[]>(base)).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to load extensions');
  }
}

export async function registerExtension(manifest: ExtensionManifest) {
  try {
    return (await axios.post<ExtensionRecord>(base, manifest)).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to register extension');
  }
}

export async function uploadExtension(file: File, signal?: AbortSignal) {
  const payload = new FormData();
  payload.append('file', file, file.name);
  try {
    return (
      await axios.post<ExtensionRecord>(`${base}/upload`, payload, { signal })
    ).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to upload extension package');
  }
}

export async function approveExtension(
  id: number,
  approval: ExtensionApproval
) {
  try {
    return (
      await axios.put<ExtensionRecord>(`${base}/${id}/approval`, approval)
    ).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to approve extension permissions');
  }
}

export async function disableExtension(id: number) {
  try {
    await axios.post(`${base}/${id}/disable`);
  } catch (error) {
    throw parseAxiosError(error, 'Unable to disable extension');
  }
}

export async function removeExtension(id: number) {
  try {
    await axios.delete(`${base}/${id}`);
  } catch (error) {
    throw parseAxiosError(error, 'Unable to remove extension');
  }
}
