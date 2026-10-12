import { fireEvent, render, screen } from '@testing-library/react';

import { Link } from './Link';

describe('Link', () => {
  it('runs the caller handler and resolves the route href', () => {
    const onClick = vi.fn((event) => event.preventDefault());

    render(
      <Link
        data-cy="environment-link"
        to="/:endpointId/docker/dashboard"
        params={{ endpointId: 1 }}
        onClick={onClick}
      >
        Environment
      </Link>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Environment' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Environment' })).toHaveAttribute(
      'href',
      '/1/docker/dashboard'
    );
  });

  it('does not navigate when the caller prevents the click', () => {
    render(
      <Link
        data-cy="environment-link"
        to="/:endpointId/docker/dashboard"
        params={{ endpointId: 1 }}
        onClick={(event) => event.preventDefault()}
      >
        Environment
      </Link>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Environment' }));

    expect(screen.getByRole('link', { name: 'Environment' })).toHaveAttribute(
      'href',
      '/1/docker/dashboard'
    );
  });
});
