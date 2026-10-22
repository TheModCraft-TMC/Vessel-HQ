import { act, renderHook } from '@testing-library/react';

import { useCopy } from './useCopy';

const writeText = vi.fn();
const execCommand = vi.fn();

beforeEach(() => {
  writeText.mockReset();
  execCommand.mockReset();
  vi.stubGlobal('isSecureContext', true);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: execCommand,
  });
});

afterEach(() => vi.unstubAllGlobals());

it('reports clipboard success only after the write resolves', async () => {
  let finish!: () => void;
  writeText.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    })
  );
  const { result } = renderHook(() => useCopy('copy me'));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.handleCopy();
  });
  expect(result.current.copiedSuccessfully).toBe(false);
  await act(async () => {
    finish();
    await pending;
  });
  expect(writeText).toHaveBeenCalledWith('copy me');
  expect(result.current.copiedSuccessfully).toBe(true);
});

it('falls back when clipboard permissions reject and removes the textarea', async () => {
  writeText.mockRejectedValue(new Error('Not allowed'));
  execCommand.mockReturnValue(true);
  const { result } = renderHook(() => useCopy('copy me'));
  await act(() => result.current.handleCopy());
  expect(execCommand).toHaveBeenCalledWith('copy');
  expect(result.current.copiedSuccessfully).toBe(true);
  expect(document.querySelector('textarea')).toBeNull();
});

it('does not report success when both clipboard and fallback fail', async () => {
  writeText.mockRejectedValue(new Error('Not allowed'));
  execCommand.mockImplementation(() => {
    throw new Error('Copy failed');
  });
  const { result } = renderHook(() => useCopy('copy me'));
  await act(() => result.current.handleCopy());
  expect(result.current.copiedSuccessfully).toBe(false);
  expect(document.querySelector('textarea')).toBeNull();
});

it('preserves the fallback for insecure HTTP deployments', async () => {
  vi.stubGlobal('isSecureContext', false);
  execCommand.mockReturnValue(true);
  const { result } = renderHook(() => useCopy('copy me'));
  await act(() => result.current.handleCopy());
  expect(writeText).not.toHaveBeenCalled();
  expect(result.current.copiedSuccessfully).toBe(true);
});

it('does not report a false-returning fallback as success', async () => {
  vi.stubGlobal('isSecureContext', false);
  execCommand.mockReturnValue(false);
  const { result } = renderHook(() => useCopy('copy me'));
  await act(() => result.current.handleCopy());
  expect(result.current.copiedSuccessfully).toBe(false);
});
