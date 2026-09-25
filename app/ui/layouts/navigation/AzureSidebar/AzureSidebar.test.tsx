import { render, within } from '@testing-library/react';

import { TestSidebarProvider } from '../useSidebarState';
import { withLayoutTestRouter } from '../../test-utils';

import { AzureSidebar } from './AzureSidebar';

test('dashboard items should render correctly', () => {
  const { getByLabelText } = renderComponent();
  const dashboardItem = getByLabelText('Dashboard');
  expect(dashboardItem).toBeVisible();
  expect(dashboardItem).toHaveTextContent('Dashboard');

  const dashboardItemElements = within(dashboardItem);
  expect(
    dashboardItemElements.getByRole('img', { hidden: true })
  ).toBeVisible();

  const containerInstancesItem = getByLabelText(/Container Instances/i);
  expect(containerInstancesItem).toBeVisible();
  expect(containerInstancesItem).toHaveTextContent('Container instances');

  const containerInstancesItemElements = within(containerInstancesItem);
  expect(
    containerInstancesItemElements.getByRole('img', { hidden: true })
  ).toBeVisible();
});

function renderComponent() {
  const Wrapped = withLayoutTestRouter(AzureSidebar);

  return render(
    <TestSidebarProvider>
      <Wrapped environmentId={1} />
    </TestSidebarProvider>
  );
}
