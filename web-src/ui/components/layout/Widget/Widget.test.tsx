import { render, screen } from '@testing-library/react';

import { Widget as CompactWidget } from '../Widget';

import { Widget, useWidgetContext } from './Widget';

function Title() {
  const { titleId } = useWidgetContext();
  return <h2 id={titleId}>Widget title</h2>;
}

it('generates distinct, stable IDs and connects the accessible title', () => {
  const content = (
    <>
      <Widget>
        <Title />
      </Widget>
      <Widget>
        <Title />
      </Widget>
    </>
  );
  const { rerender } = render(content);
  const regions = screen.getAllByRole('region', { name: 'Widget title' });
  const ids = regions.map((region) => region.getAttribute('aria-labelledby'));
  expect(new Set(ids).size).toBe(2);
  rerender(content);
  expect(
    screen
      .getAllByRole('region', { name: 'Widget title' })
      .map((region) => region.getAttribute('aria-labelledby'))
  ).toEqual(ids);
});

it.each([Widget, CompactWidget])(
  'respects explicit labels without assigning an unused title ID',
  (Component) => {
    render(<Component aria-label="Explicit name">content</Component>);
    expect(
      screen.getByRole('region', { name: 'Explicit name' })
    ).not.toHaveAttribute('aria-labelledby');
  }
);
