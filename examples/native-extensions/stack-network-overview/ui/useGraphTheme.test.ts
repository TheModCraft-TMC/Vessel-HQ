import { act, renderHook, waitFor } from '@testing-library/react';

import { useGraphTheme } from './useGraphTheme';

it('follows the Vessel theme when the user changes it without remounting', async () => {
  const initial = document.documentElement.getAttribute('theme');
  try {
    document.documentElement.setAttribute('theme', 'dark');
    const view = renderHook(useGraphTheme);
    expect(view.result.current).toBe('dark');
    act(() => document.documentElement.setAttribute('theme', 'light'));
    await waitFor(() => expect(view.result.current).toBe('light'));
    act(() => document.documentElement.setAttribute('theme', 'highcontrast'));
    await waitFor(() => expect(view.result.current).toBe('dark'));
    view.unmount();
  } finally {
    if (initial === null) document.documentElement.removeAttribute('theme');
    else document.documentElement.setAttribute('theme', initial);
  }
});
