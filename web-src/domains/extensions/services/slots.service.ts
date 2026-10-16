import axios, { parseAxiosError } from '@/shared/http';

export interface ExtensionSlotRegistration {
  id: number;
  revision: number;
  manifest: {
    id: string;
    name: string;
    packageDigest: string;
    ui: { entry: string; slots: { id: string; title: string; slot: string }[] };
  };
}

export async function getExtensionSlots(
  environmentId: number,
  stackId: number
) {
  try {
    return (
      await axios.get<ExtensionSlotRegistration[]>('/native-extensions/slots', {
        params: { environmentId, stackId },
      })
    ).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to check extension availability');
  }
}

export async function invokeStackExtension<T>(
  registrationId: number,
  operation: 'stacks.network.read' | 'stacks.traffic.read',
  input: { environmentId: number; stackId: number },
  binding: { revision: number; packageDigest: string }
) {
  try {
    return (
      await axios.post<T>(`/native-extensions/${registrationId}/invoke`, {
        operation,
        environmentId: input.environmentId,
        stackId: input.stackId,
        revision: binding.revision,
        packageDigest: binding.packageDigest,
      })
    ).data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to read stack network');
  }
}

/** One user-started, bounded session. Closing the drawer aborts its HTTP stream. */
export async function watchStackTraffic<T>(
  registrationId: number,
  input: { environmentId: number; stackId: number },
  binding: { revision: number; packageDigest: string },
  onSnapshot: (snapshot: T) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(
    `/api/native-extensions/${registrationId}/traffic-stream`,
    {
      method: 'POST',
      credentials: 'same-origin',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        operation: 'stacks.traffic.read',
        environmentId: input.environmentId,
        stackId: input.stackId,
        revision: binding.revision,
        packageDigest: binding.packageDigest,
      }),
    }
  );
  if (!response.ok || !response.body)
    throw new Error(
      `Live traffic unavailable (${response.status}). Check the stack traffic grant.`
    );
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  try {
    while (!signal.aborted) {
      const part = await reader.read();
      if (part.done) return;
      pending += decoder
        .decode(part.value, { stream: true })
        .replace(/\r\n/g, '\n');
      if (pending.length > 512 * 1024)
        throw new Error('Live traffic response exceeds its limit.');
      let boundary = pending.indexOf('\n\n');
      while (boundary >= 0) {
        const frame = pending.slice(0, boundary);
        pending = pending.slice(boundary + 2);
        const event = frame
          .split('\n')
          .find((line) => line.startsWith('event:'))
          ?.slice(6)
          .trim();
        const data = frame
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (event === 'snapshot') onSnapshot(JSON.parse(data) as T);
        if (event === 'error')
          throw new Error(
            'Live traffic stopped: access changed or the Docker read failed.'
          );
        if (event === 'end') return;
        boundary = pending.indexOf('\n\n');
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
