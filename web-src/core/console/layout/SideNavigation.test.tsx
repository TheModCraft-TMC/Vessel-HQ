import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { SideNavigation } from './SideNavigation';
import { TestSidebarProvider } from './SidebarState';
import { SidebarToggleButton } from './SidebarToggleButton';

vi.mock('@console/navigation/Sidebar/Sidebar', () => ({
  Sidebar: () => <a href="#environments">Environments</a>,
}));

function setup(mobile = true) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
  render(
    <TestSidebarProvider>
      <SidebarToggleButton />
      <SideNavigation />
    </TestSidebarProvider>
  );
}

afterEach(() => vi.unstubAllGlobals());

test('mobile navigation traps focus and Escape dismisses it, restoring the toggle', async () => {
  setup();
  expect(screen.getByRole('dialog', { name: 'Main navigation' })).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Close navigation' })
  ).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus();
  expect(
    screen.queryByRole('link', { name: 'Environments' })
  ).not.toBeInTheDocument();
});

test('selecting a mobile route closes the drawer', async () => {
  setup();
  fireEvent.click(screen.getByRole('link', { name: 'Environments' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  );
  expect(
    screen.getByRole('button', { name: 'Expand sidebar' })
  ).toHaveAttribute('aria-expanded', 'false');
});

test('desktop navigation stays available without a modal drawer', () => {
  setup(false);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.getByRole('navigation', { name: 'Main navigation' })
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
  expect(screen.getByRole('link', { name: 'Environments' })).toBeVisible();
});
