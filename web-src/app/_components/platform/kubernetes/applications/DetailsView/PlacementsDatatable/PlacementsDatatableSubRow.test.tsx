import { render, screen } from '@testing-library/react';

import { KubernetesPodNodeAffinityNodeSelectorRequirementOperators } from '@/core/kubernetes/pod/models';
import { useAuthorizations } from '@/core/session/useUser';

import { NodePlacementRowData } from '../types';

import { SubRow } from './PlacementsDatatableSubRow';

vi.mock('@/core/session/useUser', () => ({ useAuthorizations: vi.fn() }));

const node: NodePlacementRowData = {
  name: 'worker',
  acceptsApplication: false,
  highlighted: true,
  unmetTaints: [
    { key: 'private-taint', value: 'private-value', effect: 'NoSchedule' },
  ],
  unmatchedNodeSelectorLabels: [
    { key: 'private-label', value: 'private-value' },
  ],
  unmatchedNodeAffinities: [
    [
      {
        key: 'private-affinity',
        operator: KubernetesPodNodeAffinityNodeSelectorRequirementOperators.IN,
        values: 'private-value',
      },
    ],
  ],
};

function renderSubRow(authorized: boolean) {
  vi.mocked(useAuthorizations).mockReturnValue({ authorized } as ReturnType<
    typeof useAuthorizations
  >);
  return render(
    <table>
      <tbody>
        <SubRow node={node} cellCount={4} />
      </tbody>
    </table>
  );
}

it('returns only generic placement errors without detail authorization', () => {
  const { container } = renderSubRow(false);
  expect(
    screen.getByText('Placement constraint not respected for that node.')
  ).toBeVisible();
  expect(
    screen.getByText('Placement label not respected for that node.')
  ).toBeVisible();
  expect(container.textContent).not.toContain('private-');
  expect(screen.getAllByRole('cell')).toHaveLength(2);
  expect(screen.getAllByRole('cell')[0]).toHaveAttribute('colspan', '4');
});

it('keeps taint, selector, and affinity details for authorized users', () => {
  const { container } = renderSubRow(true);
  expect(container.textContent).toContain('private-taint');
  expect(container.textContent).toContain('private-label');
  expect(container.textContent).toContain('private-affinity');
  expect(
    screen.queryByText('Placement constraint not respected for that node.')
  ).not.toBeInTheDocument();
});
