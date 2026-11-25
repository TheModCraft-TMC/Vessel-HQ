import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { createStore } from 'zustand';

import { configureTestNavigation } from '@/core/test-support/next-navigation';
import { createMockEnvironment } from '@/core/test-support/test-mocks';
import { TableSettingsProvider } from '@/ui/components/data-table/useTableSettings';

import { RowProvider } from '../RowContext';

import { NameCell } from './name';

describe('container name links', () => {
  it.each(['/15/docker/containers', '/15/docker/stacks/example-stack'])(
    'opens container details from %s',
    (pathname) => {
      renderName(pathname);

      expect(
        screen.getByRole('link', { name: '/example-container' })
      ).toHaveAttribute('href', '/15/docker/containers/container-id');
    }
  );

  it('uses the row environment and preserves the encoded agent node name', () => {
    renderName('/99/docker/stacks/example-stack', 'worker / one');

    expect(
      screen.getByRole('link', { name: '/example-container' })
    ).toHaveAttribute(
      'href',
      '/15/docker/containers/container-id?nodeName=worker+%2F+one'
    );
  });
});

function renderName(pathname: string, nodeName = '') {
  configureTestNavigation({ pathname });
  const settings = createStore(() => ({ truncateContainerName: 0 }));
  const cell = {
    getValue: () => '/example-container',
    row: { original: { Id: 'container-id', NodeName: nodeName } },
  } as ComponentProps<typeof NameCell>;

  return render(
    <RowProvider context={{ environment: createMockEnvironment({ Id: 15 }) }}>
      <TableSettingsProvider settings={settings}>
        <NameCell {...cell} />
      </TableSettingsProvider>
    </RowProvider>
  );
}
