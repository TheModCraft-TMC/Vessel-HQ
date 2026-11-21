import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useFormikContext } from 'formik';
import { vi } from 'vitest';

import type { Stack } from '@/domains/stacks/models/types';

import { StackEditorTab } from './StackEditorTab';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@/core/composition/useCurrentEnvironment', () => ({
  useCurrentEnvironment: () => ({
    data: { Id: 1, Type: 1, ComposeSyntaxMaxVersion: '3.8' },
  }),
}));
vi.mock('@/core/hooks/useDockerComposeSchema/useDockerComposeSchema', () => ({
  useDockerComposeSchema: () => ({ data: {} }),
}));
vi.mock('@/domains/stacks/queries/useUpdateStack', () => ({
  useUpdateStackMutation: () => ({
    mutate: mocks.mutate,
    reset: mocks.reset,
    isLoading: false,
    isSuccess: false,
  }),
}));
vi.mock('@/domains/stacks/queries/common/useStackFile', () => ({
  useStackFile: () => ({ refetch: mocks.refetch, isFetching: false }),
}));
vi.mock('@/domains/stacks/components/common/confirm-stack-update', () => ({
  confirmStackUpdate: async () => ({ repullImageAndRedeploy: false }),
}));
vi.mock('@/ui/components/dialog/confirm', () => ({
  confirmWebEditorDiscard: async () => true,
}));
vi.mock('./StackEditorTab.validation', () => ({
  getValidationSchema: () => undefined,
}));
vi.mock('./StackEditorTabInner', () => ({
  StackEditorTabInner: function Editor() {
    const form = useFormikContext<{ stackFileContent: string }>();
    return (
      <form onSubmit={form.handleSubmit}>
        <label>
          Compose content
          <input
            value={form.values.stackFileContent}
            onChange={(event) =>
              void form.setFieldValue('stackFileContent', event.target.value)
            }
          />
        </label>
        <button type="submit">Deploy test project</button>
      </form>
    );
  },
}));

const stack = {
  Id: 1,
  Name: 'project',
  Type: 2,
  Env: [],
  StackFileVersion: 1,
} as unknown as Stack;

it('preserves edits and their original revision across background refetch, then reloads explicitly', async () => {
  mocks.mutate.mockClear();
  mocks.refetch.mockResolvedValue({
    data: { StackFileContent: 'external edit', Revision: 'new-revision' },
  });
  const { rerender } = render(
    <StackEditorTab
      stack={stack}
      isOrphaned={false}
      originalFileContent="original"
      originalFileRevision="old-revision"
    />
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Compose content' }), {
    target: { value: 'unsaved edit' },
  });
  rerender(
    <StackEditorTab
      stack={stack}
      isOrphaned={false}
      originalFileContent="external edit"
      originalFileRevision="new-revision"
    />
  );
  expect(screen.getByRole('textbox')).toHaveValue('unsaved edit');
  fireEvent.click(screen.getByRole('button', { name: 'Deploy test project' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRevision: 'old-revision',
        payload: expect.objectContaining({ stackFileContent: 'unsaved edit' }),
      }),
      expect.anything()
    )
  );

  fireEvent.click(
    screen.getByRole('button', { name: /Reload project from disk/ })
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox')).toHaveValue('external edit')
  );
  mocks.mutate.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Deploy test project' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ expectedRevision: 'new-revision' }),
      expect.anything()
    )
  );
});

it('advances the revision after saving without losing subsequent edits', async () => {
  mocks.mutate.mockClear();
  mocks.refetch.mockResolvedValue({
    data: { StackFileContent: 'first save', Revision: 'saved-revision' },
  });
  render(
    <StackEditorTab
      stack={stack}
      isOrphaned={false}
      originalFileContent="original"
      originalFileRevision="old-revision"
    />
  );
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'first save' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Deploy test project' }));
  await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce());
  const callbacks = mocks.mutate.mock.calls[0][1];
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'next unsaved edit' },
  });
  await act(() => callbacks.onSuccess());
  expect(screen.getByRole('textbox')).toHaveValue('next unsaved edit');
  mocks.mutate.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Deploy test project' }));
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRevision: 'saved-revision',
        payload: expect.objectContaining({
          stackFileContent: 'next unsaved edit',
        }),
      }),
      expect.anything()
    )
  );
});
