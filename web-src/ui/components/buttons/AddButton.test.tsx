import { render } from '@testing-library/react';

import { AddButton } from './AddButton';

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
