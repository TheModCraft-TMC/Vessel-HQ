import { render } from '@testing-library/react';
import { vi } from 'vitest';

import { AddButton } from './AddButton';

vi.mock('@uirouter/react', () => ({
  UIView: () => null,
  useSref: () => ({ onClick: vi.fn(), href: '#' }),
}));

function renderDefault({
  label = 'default label',
}: Partial<{ label: string }> = {}) {
  return render(
    <AddButton to="" data-cy="wrapped">
      {label}
    </AddButton>
  );
}

test('should display a AddButton component', async () => {
  const label = 'test label';

  const { findByText } = renderDefault({ label });

  const buttonLabel = await findByText(label);
  expect(buttonLabel).toBeTruthy();
});
