import { render, screen } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { Context } from './useSidebarState';
import { Header } from './Header';

vi.mock('@/react/portainer/feature-flags/feature-flags.service', () => ({
  isBE: false,
}));

function renderComponent(
  props = {},
  sidebarState = { isOpen: true, toggle: vi.fn() }
) {
  const Wrapped = withTestRouter(Header);

  return render(
    <Context.Provider value={sidebarState}>
      <Wrapped {...props} />
    </Context.Provider>
  );
}

describe('Header', () => {
  it('should render with default logo when no custom logo provided', () => {
    renderComponent();

    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      'src',
      expect.stringContaining('vessel-hq-logo.svg')
    );
  });

  it('should render with custom logo when provided', () => {
    const customLogo = 'https://example.com/custom-logo.png';
    renderComponent({ logo: customLogo });

    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', customLogo);
  });

  it('should apply flex-wrap class to logo container', () => {
    renderComponent();

    const logoContainer = screen.getByTestId(
      'portainerSidebar-homeImage'
    ).parentElement;
    expect(logoContainer).toHaveClass('flex-wrap');
  });

  it('should apply justify-center class when sidebar is closed', () => {
    renderComponent({}, { isOpen: false, toggle: vi.fn() });

    const logoContainer = screen.getByTestId(
      'portainerSidebar-homeImage'
    ).parentElement;
    expect(logoContainer).toHaveClass('justify-center');
  });

  it('should not apply justify-center class when sidebar is open', () => {
    renderComponent();

    const logoContainer = screen.getByTestId(
      'portainerSidebar-homeImage'
    ).parentElement;
    expect(logoContainer).not.toHaveClass('justify-center');
  });

  it('should use small logo when sidebar is closed', () => {
    renderComponent({}, { isOpen: false, toggle: vi.fn() });

    const logo = screen.getByAltText('Logo');
    expect(logo).toHaveAttribute(
      'src',
      expect.stringContaining('vessel-hq-mark.svg')
    );
  });

  it('should apply max-height class to logo when sidebar is closed', () => {
    renderComponent({}, { isOpen: false, toggle: vi.fn() });

    const logo = screen.getByAltText('Logo');
    expect(logo).toHaveClass('!max-h-[27px]');
  });

  it('should not apply max-height class to logo when sidebar is open', () => {
    renderComponent();

    const logo = screen.getByAltText('Logo');
    expect(logo).not.toHaveClass('!max-h-[27px]');
  });
});
