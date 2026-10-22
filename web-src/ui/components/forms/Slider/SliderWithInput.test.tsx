import { render, screen } from '@testing-library/react';

import { SliderWithInput } from './SliderWithInput';

it('does not leak a zero text node when the slider has no capacity', () => {
  const { container } = render(
    <SliderWithInput value={0} max={0} onChange={vi.fn()} dataCy="slider" />
  );
  expect(container.textContent).toBe('');
  expect(screen.getByRole('spinbutton')).toHaveValue(0);
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

it('still renders a slider for a positive maximum', () => {
  render(
    <SliderWithInput value={2} max={10} onChange={vi.fn()} dataCy="slider" />
  );
  expect(screen.getByRole('slider')).toBeInTheDocument();
});
