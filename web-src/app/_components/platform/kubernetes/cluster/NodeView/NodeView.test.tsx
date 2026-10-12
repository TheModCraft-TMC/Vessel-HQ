import { act, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestRouter } from '@/core/test-support/withRouter';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { UserViewModel } from '@/domains/users';
import { configureTestNavigation } from '@/core/test-support/next-navigation';

import { NodeView } from './NodeView';

vi.mock('./NodeApplicationsDatatable/NodeApplicationsDatatable', () => ({
  NodeApplicationsDatatable: () => <div data-cy="apps-table" />,
}));

vi.mock('./NodeDetails/NodeDetails', () => ({
  NodeDetails: () => <div data-cy="node-details">Node details content</div>,
}));

vi.mock(
  '@/domains/clusters/components/EventsDatatable/ResourceEventsDatatable',
  () => ({
    ResourceEventsDatatable: () => (
      <div data-cy="events-table">Events content</div>
    ),
  })
);

vi.mock('./NodeYamlInspector', () => ({
  NodeYamlInspector: () => <div data-cy="yaml-view">YAML content</div>,
}));

vi.mock('@/core/routing/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/domains/clusters/cluster/queries/useNodeQuery', () => ({
  useNodeQuery: () => ({ isInitialLoading: false, data: 'uid-123' }),
}));

vi.mock('@/domains/clusters/queries/useEvents', () => ({
  useEventWarningsCount: () => 0,
}));

function getWrapped() {
  const user = new UserViewModel({ Username: 'admin' });
  const routerConfig = [
    {
      name: 'root',
      url: '/',
      params: { endpointId: 1, nodeName: 'test-node' },
    },
  ];
  return withTestQueryProvider(
    withUserProvider(
      withTestRouter(NodeView, { route: 'root', stateConfig: routerConfig }),
      user
    )
  );
}

describe('NodeView tabs', () => {
  it('renders the tab selected by the navigation state', async () => {
    configureTestNavigation();
    const Wrapped = getWrapped();
    render(<Wrapped />);

    // initial tab is first: Node details
    expect(screen.queryByTestId('node-details')).toBeVisible();
    expect(screen.queryByTestId('events-table')).toBeNull();
    expect(screen.queryByTestId('yaml-view')).toBeNull();

    act(() => configureTestNavigation({ searchParams: { tab: 'events' } }));
    await waitFor(() => {
      expect(screen.queryByTestId('node-details')).toBeNull();
      expect(screen.queryByTestId('events-table')).toBeVisible();
    });

    act(() => configureTestNavigation({ searchParams: { tab: 'yaml' } }));
    await waitFor(() => {
      expect(screen.queryByTestId('events-table')).toBeNull();
      expect(screen.queryByTestId('yaml-view')).toBeVisible();
    });

    act(() => configureTestNavigation({ searchParams: { tab: 'namespace' } }));
    await waitFor(() => {
      expect(screen.queryByTestId('yaml-view')).toBeNull();
      expect(screen.queryByTestId('node-details')).toBeVisible();
    });
  });
});
