import { fireEvent, render, screen } from '@testing-library/react';

import { TestSidebarProvider } from './SidebarState';
import { SidebarToggleButton } from './SidebarToggleButton';

test('stays available after collapsing and expands the sidebar again', () => {
  render(
    <TestSidebarProvider>
      <SidebarToggleButton />
    </TestSidebarProvider>
  );

  fireEvent.click(
    screen.getByRole('button', { name: 'Collapse sidebar' })
  );

  const expandButton = screen.getByRole('button', {
    name: 'Expand sidebar',
  });
  expect(expandButton).toBeVisible();
  expect(expandButton).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(expandButton);

  expect(
    screen.getByRole('button', { name: 'Collapse sidebar' })
  ).toHaveAttribute('aria-expanded', 'true');
});
