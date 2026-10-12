import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/react';

import { UserViewModel } from '@/domains/users';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestRouter } from '@/core/test-support/withRouter';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { server } from '@/core/test-support/setup/server';
import { createMockEnvironment } from '@/core/test-support/test-mocks';

import { CreateContainerInstanceForm } from './CreateContainerInstanceForm';

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(CreateContainerInstanceForm), user)
  );

  return render(<Wrapped />);
}

describe('CreateContainerInstanceForm', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/endpoints/5', () =>
        HttpResponse.json(createMockEnvironment())
      )
    );
  });

  // TODO: from R8S-730 - enable this test once it passes
  it.skip('should not display any visible error messages on initial load', async () => {
    renderComponent();

    const errors = await screen.findByRole('alert');

    // Check that no error messages (role="alert") are visible
    expect(errors).not.toBeInTheDocument();
  });

  it('submit button should be disabled when name or image is missing', async () => {
    const { findByText, getByText, getByLabelText } = renderComponent();

    await expect(findByText(/Azure settings/)).resolves.toBeVisible();

    const button = getByText(/Deploy the container/);
    expect(button).toBeVisible();
    expect(button).toBeDisabled();

    const nameInput = getByLabelText(/name/i, { selector: 'input' });
    await userEvent.type(nameInput, 'name');

    const imageInput = getByLabelText(/image/i, { selector: 'input' });
    await userEvent.type(imageInput, 'image');

    await expect(findByText(/Deploy the container/)).resolves.toBeEnabled();

    expect(nameInput).toHaveValue('name');
    await userEvent.clear(nameInput);

    await expect(findByText(/Deploy the container/)).resolves.toBeDisabled();
  });
});
