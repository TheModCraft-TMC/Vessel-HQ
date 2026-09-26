import { lazy, Suspense } from 'react';
import { render, screen } from '@testing-library/react';

import { lazyRoute } from './lazyRoute';

describe('lazyRoute', () => {
  it('renders a named component export', async () => {
    const Route = lazyRoute(
      async () => ({ Page: () => <div>Direct route</div> }),
      'Page'
    );

    render(
      <Suspense fallback="Loading">
        <Route />
      </Suspense>
    );

    expect(await screen.findByText('Direct route')).toBeVisible();
  });

  it('renders a named export that is already lazy', async () => {
    const NestedPage = lazy(async () => ({
      default: () => <div>Nested lazy route</div>,
    }));
    const Route = lazyRoute(async () => ({ Page: NestedPage }), 'Page');

    render(
      <Suspense fallback="Loading">
        <Route />
      </Suspense>
    );

    expect(await screen.findByText('Nested lazy route')).toBeVisible();
  });
});
