import { PropsWithChildren, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import { ClientApp } from './ClientApp';

const mocks = vi.hoisted(() => ({ stateName: 'portainer.auth' }));

vi.mock('@uirouter/react', () => ({
  UIRouter: ({ children }: PropsWithChildren) => <>{children}</>,
  UIView: ({ name }: { name: string }) => <div data-cy={`${name}-view`} />,
  useCurrentStateAndParams: () => ({
    state: { name: mocks.stateName },
    params: {},
  }),
}));

vi.mock('./router', () => ({ router: {} }));

vi.mock('@/core/query', () => ({
  QueryProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/core/composition', () => ({
  ApplicationBindingsProvider: ({ children }: PropsWithChildren) => (
    <div data-cy="application-bindings">{children}</div>
  ),
  LayoutBindingsProvider: ({ children }: PropsWithChildren) => (
    <div data-cy="layout-bindings">{children}</div>
  ),
}));

vi.mock('@/ui/layouts/mobile-navigation/useSidebarState', () => ({
  SidebarProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/react/hooks/useUser', () => ({
  UserProvider: ({ children }: PropsWithChildren) => (
    <div data-cy="user-provider">{children}</div>
  ),
}));

vi.mock('@/ui', () => ({
  PublicLayout: ({ content }: { content: ReactNode }) => (
    <div data-cy="public-layout">{content}</div>
  ),
  AuthenticatedLayout: ({
    content,
    sidebar,
  }: {
    content: ReactNode;
    sidebar: ReactNode;
  }) => (
    <div data-cy="authenticated-layout">
      {sidebar}
      {content}
    </div>
  ),
}));

describe('ClientApp', () => {
  it('renders public routes without authenticated providers', () => {
    mocks.stateName = 'portainer.auth';

    render(<ClientApp />);

    expect(screen.getByTestId('public-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('user-provider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layout-bindings')).not.toBeInTheDocument();
  });

  it('places layout bindings inside the user provider on authenticated routes', () => {
    mocks.stateName = 'portainer.home';

    render(<ClientApp />);

    const userProvider = screen.getByTestId('user-provider');
    const layoutBindings = screen.getByTestId('layout-bindings');

    expect(userProvider).toContainElement(layoutBindings);
    expect(layoutBindings).toContainElement(
      screen.getByTestId('authenticated-layout')
    );
  });
});
