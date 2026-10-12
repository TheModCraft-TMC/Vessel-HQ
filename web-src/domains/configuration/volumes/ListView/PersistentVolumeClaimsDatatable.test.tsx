import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withTestRouter } from '@/core/test-support/withRouter';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { http, server } from '@/core/test-support/setup/server';
import { createMockEnvironment } from '@/core/test-support/test-mocks';
import type { PortainerNamespace } from '@/domains/namespaces';
import { ModalHeader } from '@/ui/components/dialog/Modal/ModalHeader';

import { PersistentVolumeClaimsDatatable } from './PersistentVolumeClaimsDatatable';
import type { PersistentVolumeClaim } from './types';

const mockUseEnvironmentId = vi.fn();

vi.mock('@/core/routing/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock(
  '@/core/session/useUser',
  async (importOriginal: () => Promise<Record<string, unknown>>) => ({
    ...(await importOriginal()),
    useAuthorizations: () => ({ authorized: true, isLoading: false }),
  })
);

vi.mock(
  '@/domains/configuration/volumes/queries/useDeletePersistentVolumeClaims',
  () => ({
    useDeletePersistentVolumeClaims: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
  })
);

vi.mock('@/domains/configuration/volumes/ListView/ResizeClaimEditForm', () => ({
  ResizeClaimEditForm: ({ claim }: { claim: PersistentVolumeClaim }) => (
    <>
      <ModalHeader title="Resize Persistent Volume Claim" />
      <div data-cy="resize-form">Resize form for {claim.name}</div>
    </>
  ),
}));

vi.mock('@console/navigation/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span data-cy="mock-link">{children}</span>
  ),
}));

vi.mock('@/domains/clusters/components/CreateFromManifestButton', () => ({
  CreateFromManifestButton: ({ 'data-cy': dataCy }: { 'data-cy'?: string }) => (
    <button type="button" data-cy={dataCy}>
      Create from manifest
    </button>
  ),
}));

const mockPVCs: PersistentVolumeClaim[] = [
  {
    id: 'pvc-1',
    name: 'test-pvc-1',
    namespace: 'default',
    storage: 10737418240,
    storageRequest: '10Gi',
    creationDate: '2024-01-01T00:00:00Z',
    accessModes: ['ReadWriteOnce'],
    humanReadableAccessModes: ['ReadWriteOnce'],
    volumeName: 'pv-1',
    storageClass: 'standard',
    allowVolumeExpansion: true,
    phase: 'Bound',
  },
  {
    id: 'pvc-2',
    name: 'test-pvc-2',
    namespace: 'kube-system',
    storage: 5368709120,
    storageRequest: '5Gi',
    creationDate: '2024-01-02T00:00:00Z',
    accessModes: ['ReadOnlyMany'],
    humanReadableAccessModes: ['ReadOnlyMany'],
    volumeName: 'pv-2',
    storageClass: 'standard',
    allowVolumeExpansion: false,
    phase: 'Pending',
  },
];

const pvcWithWorkload: PersistentVolumeClaim = {
  id: 'pvc-3',
  name: 'used-pvc',
  namespace: 'default',
  storage: 1073741824,
  storageRequest: '1Gi',
  creationDate: '2024-01-03T00:00:00Z',
  accessModes: ['ReadWriteOnce'],
  humanReadableAccessModes: ['ReadWriteOnce'],
  volumeName: 'pv-3',
  storageClass: 'standard',
  allowVolumeExpansion: false,
  phase: 'Bound',
  owningApplications: [
    {
      Name: 'my-deployment',
      ResourcePool: 'default',
      ApplicationType: 'Deployment',
    },
  ],
};

const mockNamespaces = [
  { Name: 'default', IsSystem: false },
  { Name: 'kube-system', IsSystem: true },
] as PortainerNamespace[];

function renderComponent(
  namespaces: PortainerNamespace[] = [],
  claims: PersistentVolumeClaim[] = mockPVCs
) {
  server.use(
    http.get('/api/endpoints/:endpointId', () =>
      HttpResponse.json(createMockEnvironment())
    ),
    http.get('/api/kubernetes/:environmentId/namespaces', () =>
      HttpResponse.json(namespaces)
    ),
    http.get('/api/kubernetes/:environmentId/persistent_volume_claims', () =>
      HttpResponse.json(claims)
    )
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(PersistentVolumeClaimsDatatable))
  );

  return render(<Wrapped />);
}

describe('PersistentVolumeClaimsDatatable', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseEnvironmentId.mockReturnValue(3);
  });

  it('renders the datatable with PVC names and title', async () => {
    renderComponent();

    expect(await screen.findByText('Volume claims')).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText('test-pvc-1')).toBeVisible();
      expect(screen.getByText('test-pvc-2')).toBeVisible();
    });
  });

  it('shows an empty table when there are no PVCs', async () => {
    renderComponent([], []);

    expect(await screen.findByText('Volume claims')).toBeVisible();
    expect(screen.queryByText('test-pvc-1')).not.toBeInTheDocument();
  });

  it('opens the resize modal when edit is clicked for an expandable PVC', async () => {
    renderComponent();

    await screen.findByRole('button', {
      name: 'Resize volume claim test-pvc-1',
    });
    expect(
      screen.getByRole('button', {
        name: 'Resize volume claim test-pvc-1',
      })
    ).not.toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Resize volume claim test-pvc-1' })
    );

    expect(
      await screen.findByText('Resize Persistent Volume Claim')
    ).toBeVisible();
    expect(screen.getByTestId('resize-form')).toHaveTextContent('test-pvc-1');
  });

  it('disables the resize button for PVCs where volume expansion is not allowed', async () => {
    const { container } = renderComponent();

    await screen.findByText('test-pvc-2');

    const editButton = container.querySelector(
      '[data-cy="kubernetes-pv-resize-edit-test-pvc-2"]'
    ) as HTMLButtonElement;

    expect(editButton).toBeDisabled();
  });

  it('does not show the resize modal initially', async () => {
    renderComponent();

    await screen.findByText('test-pvc-1');

    expect(screen.queryByTestId('resize-form')).not.toBeInTheDocument();
  });

  describe('Used by column', () => {
    it('shows the owning application name for PVCs with a workload', async () => {
      renderComponent([], [pvcWithWorkload]);

      expect(await screen.findByText('my-deployment')).toBeVisible();
    });

    it('shows a dash for PVCs with no owning applications', async () => {
      renderComponent([], [mockPVCs[0]]);

      await screen.findByText('test-pvc-1');
      expect(screen.getByText('-')).toBeVisible();
    });
  });

  describe('row selectability', () => {
    it('disables the row checkbox for PVCs with owning applications', async () => {
      const { container } = renderComponent([], [mockPVCs[0], pvcWithWorkload]);

      await screen.findByText('used-pvc');

      // skip header checkbox (index 0); row checkboxes follow in render order
      const rowCheckboxes = Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      ).slice(1);

      const [freeCheckbox, usedCheckbox] = rowCheckboxes;
      expect(freeCheckbox).not.toBeDisabled();
      expect(usedCheckbox).toBeDisabled();
    });

    it('allows selection of a Bound PVC that has no owning applications', async () => {
      const { container } = renderComponent([], [mockPVCs[0]]);

      await screen.findByText('test-pvc-1');

      const rowCheckboxes = Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      ).slice(1);

      expect(rowCheckboxes[0]).not.toBeDisabled();
    });
  });

  it('hides system namespace PVCs by default', async () => {
    renderComponent(mockNamespaces);

    expect(await screen.findByText('test-pvc-1')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByText('test-pvc-2')).not.toBeInTheDocument();
    });
  });

  it('shows system namespace PVCs when showSystemResources is enabled', async () => {
    localStorage.setItem(
      'portainer.datatable_settings_kube-volumes-pvc',
      JSON.stringify({ state: { showSystemResources: true }, version: 1 })
    );
    renderComponent(mockNamespaces);

    expect(await screen.findByText('test-pvc-1')).toBeVisible();
    expect(screen.getByText('test-pvc-2')).toBeVisible();
  });
});
