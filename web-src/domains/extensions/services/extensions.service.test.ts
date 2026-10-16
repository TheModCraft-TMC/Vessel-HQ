import { vi } from 'vitest';

import axios from '@/shared/http';

import { uploadExtension } from './extensions.service';

vi.mock('@/shared/http', () => ({
  default: { post: vi.fn() },
  parseAxiosError: (error: unknown) => error,
}));

it('sends the .vesselhq archive as multipart file without overriding the boundary header', async () => {
  vi.mocked(axios.post).mockResolvedValue({ data: { id: 9 } });
  const file = new File(['test ZIP bytes'], 'inspector.vesselhq', {
    type: 'application/zip',
  });
  const controller = new AbortController();
  await uploadExtension(file, controller.signal);
  expect(axios.post).toHaveBeenCalledWith(
    '/native-extensions/upload',
    expect.any(FormData),
    { signal: controller.signal }
  );
  const form = vi.mocked(axios.post).mock.calls[0][1] as FormData;
  const uploaded = form.get('file') as File;
  expect(uploaded.name).toBe('inspector.vesselhq');
  expect(uploaded.size).toBe(file.size);
});
