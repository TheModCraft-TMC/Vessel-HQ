import { render, screen } from '@testing-library/react';

import { ViewLoading } from './ViewLoading';

describe('ViewLoading', () => {
  it('renders an accessible animated skeleton and message', () => {
    const { container } = render(<ViewLoading message="Loading container..." />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading container...')).toBeVisible();
    expect(container.querySelector('[data-cy="view-loading-skeleton"]')).toHaveClass(
      'animate-pulse',
      'motion-reduce:animate-none'
    );
    expect(container.querySelector('.sk-fold')).not.toBeInTheDocument();
  });
});
