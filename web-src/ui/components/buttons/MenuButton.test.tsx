import type { ElementType, PropsWithChildren, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Plus, Edit } from 'lucide-react';

import { MenuItem } from '@/ui/components/menu';

import { MenuButton, MenuButtonLink, MenuButtonProps } from './MenuButton';

function mapItems(items: Array<MockMenuButtonItem>) {
  return items.map((item) => item.element);
}

type MockMenuButtonItem = {
  id: string;
  element: ReactNode;
  handler?: () => void;
};

function createMockMenuItem({
  id,
  label,
  icon,
  onClick,
  disabled,
}: {
  id: string;
  label: string;
  icon?: ElementType;
  onClick?: () => void;
  disabled?: boolean;
}): MockMenuButtonItem {
  const IconComponent = icon;
  const handler = onClick;

  return {
    id,
    handler,
    element: (
      <MenuItem key={id} disabled={disabled} onSelect={handler ?? (() => {})}>
        {IconComponent ? <IconComponent /> : null}
        {label}
      </MenuItem>
    ),
  };
}

const mockItems: Array<MockMenuButtonItem> = [
  createMockMenuItem({
    id: 'create',
    label: 'Create new',
    icon: Plus,
    onClick: vi.fn(),
  }),
  createMockMenuItem({
    id: 'edit',
    label: 'Edit existing',
    icon: Edit,
    onClick: vi.fn(),
  }),
];

type RenderOptions = Omit<
  Partial<PropsWithChildren<MenuButtonProps>>,
  'items'
> & {
  items?: Array<MockMenuButtonItem>;
};

function renderDefault({
  items = mockItems,
  children = 'Test Menu',
  color = 'primary',
  size = 'small',
  disabled = false,
  ...props
}: RenderOptions = {}) {
  return render(
    <MenuButton
      items={mapItems(items)}
      color={color}
      size={size}
      disabled={disabled}
      data-cy="menu-button"
      {...props}
    >
      {children}
    </MenuButton>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('should display MenuButton with correct text and chevron icon', async () => {
  const children = 'Test Actions';
  renderDefault({ children });

  const button = await screen.findByText(children);
  expect(button).toBeTruthy();

  // Check for chevron down icon (it should be in the DOM)
  const chevronIcon = button.closest('button')?.querySelector('svg');
  expect(chevronIcon).toBeTruthy();
});

test('should not show menu items by default', async () => {
  renderDefault();
  expect(screen.queryByRole('menuitem')).toBeNull();
});

test('should show menu items when clicked', async () => {
  renderDefault();
  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);
  expect(await screen.findByText('Create new')).toBeTruthy();
  expect(await screen.findByText('Edit existing')).toBeTruthy();
});

test('should hide menu items when something else is clicked', async () => {
  renderDefault();
  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);
  expect(await screen.findByText('Create new')).toBeTruthy();

  // click outside
  fireEvent.mouseDown(document.body);
  // items should disappear
  expect(screen.queryByText('Create new')).toBeNull();
  expect(screen.queryByText('Edit existing')).toBeNull();
});

test('should call onClick when menu item is clicked', async () => {
  renderDefault();

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  const createItem = await screen.findByText('Create new');
  fireEvent.click(createItem);

  expect(mockItems[0].handler).toHaveBeenCalled();
});

test('should not call onClick when disabled item is clicked', async () => {
  const disabledItemMock = createMockMenuItem({
    id: 'disabled',
    label: 'Disabled action',
    disabled: true,
    onClick: vi.fn(),
  });

  renderDefault({ items: [disabledItemMock] });

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  const disabledItem = await screen.findByText('Disabled action');
  fireEvent.click(disabledItem);

  expect(disabledItemMock.handler).not.toHaveBeenCalled();
});

test('should support link items', async () => {
  render(
    <MenuButton
      items={[
        <MenuButtonLink
          key="docs"
          to="/:endpointId/kubernetes/deploy"
          params={{ endpointId: 1 }}
          label="Docs"
          data-cy="menu-button-link-docs"
        >
          Deploy
        </MenuButtonLink>,
      ]}
      color="primary"
      data-cy="menu-button-link"
    >
      Mixed
    </MenuButton>
  );

  const trigger = await screen.findByText('Mixed');
  fireEvent.click(trigger);

  const link = await screen.findByText('Deploy');
  expect(link).toHaveAttribute('href', '/1/kubernetes/deploy');
});

test('should be disabled when disabled prop is true', async () => {
  renderDefault({ disabled: true });

  const button = await screen.findByText('Test Menu');
  expect(button.closest('button')).toBeDisabled();
  expect(button.closest('button')).toHaveClass('disabled');
});

test('should render menu items with icons', async () => {
  renderDefault();

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  // Check that menu items have icons (SVG elements)
  const createItem = await screen.findByText('Create new');
  const editItem = await screen.findByText('Edit existing');

  expect(
    createItem.closest('[role="menuitem"]')?.querySelector('svg')
  ).toBeTruthy();
  expect(
    editItem.closest('[role="menuitem"]')?.querySelector('svg')
  ).toBeTruthy();
});

test('should render with custom className', async () => {
  renderDefault({ className: 'custom-class' });

  const button = await screen.findByText('Test Menu');
  expect(button.closest('button')).toHaveClass('custom-class');
});

test('should have proper accessibility attributes for screen readers', async () => {
  render(
    <MenuButton
      items={[
        <MenuButtonLink
          key="docs"
          to="/:endpointId/kubernetes/deploy"
          params={{ endpointId: 1 }}
          label="Deploy"
          data-cy="menu-button-link-docs"
        >
          Deploy
        </MenuButtonLink>,
      ]}
      color="primary"
      data-cy="menu-button-keyboard"
    >
      Accessibility Test
    </MenuButton>
  );

  const trigger = await screen.findByText('Accessibility Test');

  // Open menu to reveal the link
  fireEvent.click(trigger);

  const link = await screen.findByText('Deploy');
  expect(link).toBeVisible();

  // Test that the link has proper accessibility attributes
  expect(link).toHaveAttribute('aria-label', 'Deploy'); // Screen reader support
  expect(link).toHaveAttribute('role', 'menuitem'); // Proper ARIA role
  expect(link).toHaveAttribute('href'); // Has navigation href
});
