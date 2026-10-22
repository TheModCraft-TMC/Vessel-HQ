import { fireEvent, render, screen } from '@testing-library/react';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';

import { UserMenu } from './UserMenu';

test('keeps a long account identity available without changing the menu name', () => {
  const username = `${'long-account-name-'.repeat(30)}@example.invalid`;

  render(
    <TestLayoutProvider overrides={{ user: { Id: 1, Username: username } }}>
      <UserMenu />
    </TestLayoutProvider>
  );

  const trigger = screen.getByRole('button', { name: 'User menu toggle' });
  expect(trigger).toHaveAttribute('title', username);
  expect(trigger).toHaveTextContent(username);

  fireEvent.click(trigger);

  expect(screen.getByRole('menuitem', { name: 'My account' })).toBeVisible();
  expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
});
