import axios, { parseAxiosError } from '@/shared/http';

export interface ExtensionNote {
  text: string;
  version: number;
}
export function extensionStorage(
  id: number,
  revision: number,
  packageDigest: string
) {
  return {
    async read(): Promise<ExtensionNote> {
      try {
        return (
          await axios.get<ExtensionNote>(`/native-extensions/${id}/storage`, {
            params: { revision, packageDigest },
          })
        ).data;
      } catch (error) {
        throw parseAxiosError(error, 'Unable to load extension notes');
      }
    },
    async write(note: ExtensionNote): Promise<ExtensionNote> {
      try {
        return (
          await axios.put<ExtensionNote>(`/native-extensions/${id}/storage`, {
            revision,
            packageDigest,
            text: note.text,
            version: note.version,
          })
        ).data;
      } catch (error) {
        throw parseAxiosError(error, 'Unable to save extension notes');
      }
    },
  };
}
