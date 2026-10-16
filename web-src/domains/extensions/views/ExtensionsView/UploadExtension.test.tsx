import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { maxExtensionUploadBytes, UploadExtension } from './UploadExtension';

it('uploads a selected .vesselhq package with its original filename and clears selection after success', async () => {
  const onUpload = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<UploadExtension disabled={false} onUpload={onUpload} />);
  const file = new File(['package'], 'inspector.vesselhq', {
    type: 'application/zip',
  });
  await user.upload(screen.getByLabelText('Extension package'), file);
  await user.click(screen.getByRole('button', { name: 'Upload package' }));
  expect(onUpload).toHaveBeenCalledWith(file, expect.any(AbortSignal));
  expect(
    await screen.findByText(/Package uploaded. Review its permissions/)
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Upload package' })).toBeDisabled();
});

it('retains the selected file and reports a server error without claiming approval', async () => {
  const onUpload = vi
    .fn()
    .mockRejectedValue(new Error('Package digest mismatch'));
  const user = userEvent.setup();
  render(<UploadExtension disabled={false} onUpload={onUpload} />);
  const file = new File(['bad package'], 'inspector.vesselhq');
  await user.upload(screen.getByLabelText('Extension package'), file);
  await user.click(screen.getByRole('button', { name: 'Upload package' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Package digest mismatch'
  );
  expect(screen.getByLabelText('Extension package')).toHaveProperty(
    'files',
    expect.objectContaining({ 0: file })
  );
  expect(screen.getByRole('button', { name: 'Upload package' })).toBeEnabled();
  expect(
    screen.queryByText(/Package uploaded. Review/)
  ).not.toBeInTheDocument();
});

it('rejects plain ZIP filenames before sending a package', async () => {
  const onUpload = vi.fn();
  const user = userEvent.setup({ applyAccept: false });
  render(<UploadExtension disabled={false} onUpload={onUpload} />);
  await user.upload(
    screen.getByLabelText('Extension package'),
    new File(['archive'], 'inspector.zip')
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Choose a .vesselhq extension package'
  );
  expect(screen.getByRole('button', { name: 'Upload package' })).toBeDisabled();
  expect(onUpload).not.toHaveBeenCalled();
});

it('rejects packages above the 64 MiB compressed upload limit', async () => {
  const onUpload = vi.fn();
  const user = userEvent.setup();
  const file = new File(['archive'], 'large.vesselhq');
  Object.defineProperty(file, 'size', { value: maxExtensionUploadBytes + 1 });
  render(<UploadExtension disabled={false} onUpload={onUpload} />);
  await user.upload(screen.getByLabelText('Extension package'), file);
  expect(screen.getByRole('alert')).toHaveTextContent('64 MiB or smaller');
  expect(onUpload).not.toHaveBeenCalled();
});

it('cancels an in-flight upload and keeps the selection for retry', async () => {
  const onUpload = vi.fn(
    (_file: File, signal: AbortSignal) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new Error('Aborted')))
      )
  );
  const user = userEvent.setup();
  render(<UploadExtension disabled={false} onUpload={onUpload} />);
  await user.upload(
    screen.getByLabelText('Extension package'),
    new File(['archive'], 'inspector.vesselhq')
  );
  await user.click(screen.getByRole('button', { name: 'Upload package' }));
  expect(screen.getByLabelText('Extension package')).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Cancel upload' }));
  await waitFor(() =>
    expect(screen.getByText(/Upload cancelled/)).toBeVisible()
  );
  expect(screen.getByRole('button', { name: 'Upload package' })).toBeEnabled();
});
