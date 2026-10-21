import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { confirmUpdate } from '@/ui/components/dialog/confirm';
import { notifyError } from '@/ui/components/toast/notifications';

import { useToggleSystemNamespaceMutation } from '../../queries/useToggleSystemNamespace';

import { ToggleSystemNamespaceButton } from './ToggleSystemNamespaceButton';

vi.mock('@/ui/components/dialog/confirm', () => ({ confirmUpdate: vi.fn() }));
vi.mock('@/ui/components/toast/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock('../../queries/useToggleSystemNamespace', () => ({
  useToggleSystemNamespaceMutation: vi.fn(),
}));

it('reports a failed confirmation without updating the namespace or leaking a rejection', async () => {
  const user = userEvent.setup();
  const mutate = vi.fn();
  vi.mocked(useToggleSystemNamespaceMutation).mockReturnValue({
    mutate,
    isLoading: false,
  } as unknown as ReturnType<typeof useToggleSystemNamespaceMutation>);
  const error = new Error('Unable to create dialog');
  vi.mocked(confirmUpdate).mockRejectedValueOnce(error);
  render(
    <ToggleSystemNamespaceButton
      isSystemNamespace={false}
      isEdit
      environmentId={1}
      namespaceName="example"
    />
  );
  await user.click(screen.getByRole('button', { name: 'Mark as system' }));
  await waitFor(() => {
    expect(notifyError).toHaveBeenCalledWith(
      'Unable to confirm namespace update',
      error
    );
  });
  expect(mutate).not.toHaveBeenCalled();
});
