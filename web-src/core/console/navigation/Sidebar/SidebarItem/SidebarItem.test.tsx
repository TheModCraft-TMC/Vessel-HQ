import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';

import { TestSidebarProvider } from '../../../layout/SidebarState';

import { SidebarItem } from './SidebarItem';

vi.mock('next/navigation', () => ({
  usePathname: () => '/1/docker/dashboard',
}));

vi.mock('@console/navigation/Link', () => ({
  Link: ({ to, children, ...props }: PropsWithChildren<
    AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
  >) => {
    return (
      <a data-next-link="true" href={to} {...props}>
        {children}
      </a>
    );
  },
}));

describe('SidebarItem', () => {
  it('uses client-side navigation for an environment link', () => {
    render(
      <TestSidebarProvider>
        <SidebarItem
          to="/:endpointId/docker/containers"
          params={{ endpointId: 1 }}
          label="Containers"
        />
      </TestSidebarProvider>
    );

    expect(screen.getByRole('link', { name: 'Containers' })).toHaveAttribute(
      'href',
      '/1/docker/containers'
    );
    expect(screen.getByRole('link', { name: 'Containers' })).toHaveAttribute(
      'data-next-link',
      'true'
    );
  });
});
