import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@/ui/components/buttons/Button';

import { Card } from './Card';

const meta = {
  title: 'Design System/Dependency CSS compatibility',
  parameters: { msw: { handlers: [] } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Intentionally exercises retained Bootstrap rules alongside the maintained
// Tailwind utilities and actual Vessel primitives. No Bootstrap JS is loaded.
export const Presentation: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await document.fonts.ready;
    const box = getComputedStyle(canvas.getByTestId('utility-box'));
    await expect(box.display).toBe('flex');
    await expect(box.padding).toBe('16px');
    await expect(box.borderRadius).toBe('4px');
    await expect(box.borderWidth).toBe('1px');
    await expect(
      canvas.getByLabelText('Environment name').getBoundingClientRect().height
    ).toBe(34);
    await expect(document.fonts.check('14px "Glyphicons Halflings"')).toBe(
      true
    );
    await expect(
      getComputedStyle(canvas.getByText('Accessible status')).position
    ).toBe('absolute');
    const columns = canvas
      .getAllByTestId('bootstrap-column')
      .map((element) => element.getBoundingClientRect());
    if (window.innerWidth >= 768) {
      await expect(columns[0].y).toBe(columns[1].y);
    } else {
      await expect(columns[1].y).toBeGreaterThan(columns[0].y);
    }
    await userEvent.clear(canvas.getByLabelText('Environment name'));
    await userEvent.type(
      canvas.getByLabelText('Environment name'),
      'Local fixture'
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save environment' })
    );
    await expect(
      canvas.getByRole('button', { name: 'Disabled' })
    ).toBeDisabled();
  },
  render: () => (
    <div className="h-screen overflow-auto p-4" data-testid="dependency-styles">
      <h1>Dependency presentation compatibility</h1>
      <div className="row" data-testid="bootstrap-row">
        <div className="col-sm-6" data-testid="bootstrap-column">
          <Card.Container>
            <Card.Header title="Environment access" />
            <Card.Body>
              <label htmlFor="fixture-name">Environment name</label>
              <input
                id="fixture-name"
                className="form-control"
                defaultValue="Isolated fixture"
              />
              <div className="mt-4 flex items-center gap-2">
                <Button data-cy="dependency-save">Save environment</Button>
                <button type="button" className="btn btn-default" disabled>
                  Disabled
                </button>
              </div>
            </Card.Body>
          </Card.Container>
        </div>
        <div className="col-sm-6" data-testid="bootstrap-column">
          <div className="panel panel-default">
            <div className="panel-heading">
              Retained presentation, no JS plugins
            </div>
            <div className="panel-body">
              <span
                className="glyphicon glyphicon-ok"
                aria-hidden="true"
                data-testid="bootstrap-glyph"
              />
              <span className="sr-only">Accessible status</span>
              <p
                className="text-blue-8 th-dark:text-white th-highcontrast:text-white mt-4"
                data-testid="theme-text"
              >
                Light, dark and high contrast
              </p>
              <div
                className="border-gray-5 flex! gap-2 rounded-sm border border-solid p-4"
                data-testid="utility-box"
              >
                <span>Grid and utility cascade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
