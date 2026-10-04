import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { AppTemplatesListItem as BaseComponent } from './AppTemplatesListItem';
import { TemplateViewModel } from './view-model';
import { TemplateType } from './types';

test('should render AppTemplatesListItem component', () => {
  const template: TemplateViewModel = {
    Title: 'Test Template',
    // provide necessary properties for the template object
  } as TemplateViewModel;

  const onSelect = vi.fn();
  const isSelected = false;

  const { getByText } = renderComponent({ isSelected, template, onSelect });

  expect(getByText(template.Title, { exact: false })).toBeInTheDocument();
});

const copyAsCustomTestCases = [
  {
    type: TemplateType.Container,
    expected: false,
  },
  {
    type: TemplateType.ComposeStack,
    expected: true,
  },
  {
    type: TemplateType.SwarmStack,
    expected: true,
  },
];

// TODO - remove after fixing workaround for UISref
copyAsCustomTestCases.forEach(({ type, expected }) => {
  test(`copy as custom button should ${
    expected ? '' : 'not '
  }be rendered for type ${TemplateType[type]}`, () => {
    const onSelect = vi.fn();
    const isSelected = false;

    const { queryByText, unmount } = renderComponent({
      isSelected,
      template: {
        Type: type,
      } as TemplateViewModel,
      onSelect,
    });

    if (expected) {
      expect(queryByText('Copy as Custom')).toBeVisible();
    } else {
      expect(queryByText('Copy as Custom')).toBeNull();
    }

    unmount();
  });
});

test('should call onSelect when clicked', async () => {
  const user = userEvent.setup();
  const template: TemplateViewModel = {
    Title: 'Test Template',
    // provide necessary properties for the template object
  } as TemplateViewModel;

  const onSelect = vi.fn();
  const isSelected = false;

  const { getByLabelText } = renderComponent({
    isSelected,
    template,
    onSelect,
  });

  const button = getByLabelText(template.Title);
  await user.click(button);

  expect(onSelect).toHaveBeenCalledWith(template);
});

function renderComponent({
  isSelected = false,
  onSelect,
  template,
}: {
  template: TemplateViewModel;
  onSelect?: () => void;
  isSelected?: boolean;
}) {
  const AppTemplatesListItem = withTestRouter(BaseComponent);

  return render(
    <AppTemplatesListItem
      template={template}
      onSelect={onSelect}
      isSelected={isSelected}
    />
  );
}
