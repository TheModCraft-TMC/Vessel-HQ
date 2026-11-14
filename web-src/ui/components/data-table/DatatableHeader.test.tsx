import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { DatatableHeader } from './DatatableHeader';

it('omits empty action and settings groups returned by default table callbacks', () => {
  const actions = vi.fn(() => null);
  const settings = vi.fn(() => null);
  const { container } = render(
    <DatatableHeader
      data-cy="network-header"
      title="Networks"
      searchValue=""
      onSearchChange={() => {}}
      renderTableActions={actions}
      renderTableSettings={settings}
    />
  );

  expect(screen.getByRole('heading', { name: 'Networks' })).toBeVisible();
  expect(container.querySelector('.actionBar')).toBeNull();
  expect(container.querySelector('.settings')).toBeNull();
  expect(actions).toHaveBeenCalledOnce();
  expect(settings).toHaveBeenCalledOnce();
});

it('keeps populated action and settings controls in the shared toolbar', () => {
  const { container } = render(
    <DatatableHeader
      data-cy="network-header"
      title="Networks"
      searchValue=""
      onSearchChange={() => {}}
      renderTableActions={() => <button type="button">Add network</button>}
      renderTableSettings={() => <button type="button">Table settings</button>}
    />
  );

  expect(container.querySelector('.actionBar')).toContainElement(
    screen.getByRole('button', { name: 'Add network' })
  );
  expect(container.querySelector('.settings')).toContainElement(
    screen.getByRole('button', { name: 'Table settings' })
  );
});
