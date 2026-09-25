import { fireEvent, render, screen } from '@testing-library/react';

import { Link } from './Link';

const mockSrefClick = vi.hoisted(() => vi.fn());

vi.mock('@uirouter/react', () => ({
  useSref: () => ({
    href: '#/environment',
    onClick: mockSrefClick,
  }),
}));

describe('Link', () => {
  beforeEach(() => {
    mockSrefClick.mockReset();
  });

  it('runs the caller handler without replacing router navigation', () => {
    const onClick = vi.fn();

    render(
      <Link data-cy="environment-link" to="docker.dashboard" onClick={onClick}>
        Environment
      </Link>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Environment' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(mockSrefClick).toHaveBeenCalledOnce();
  });

  it('does not navigate when the caller prevents the click', () => {
    render(
      <Link
        data-cy="environment-link"
        to="docker.dashboard"
        onClick={(event) => event.preventDefault()}
      >
        Environment
      </Link>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Environment' }));

    expect(mockSrefClick).not.toHaveBeenCalled();
  });
});
