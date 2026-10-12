import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/core/test-support/setup/server';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestRouter } from '@/core/test-support/withRouter';
import { createMockStack } from '@/core/test-support/test-mocks';

import { StackInfoTab } from './StackInfoTab';

vi.mock('@/core/routing/useEnvironmentId', () => ({
  useEnvironmentId: vi.fn(() => 1),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initial rendering', () => {
  it('should render stack name', () => {
    renderComponent({ stackName: 'my-test-stack' });

    expect(screen.getByText('my-test-stack')).toBeVisible();
  });

  it('should render StackActions when stack exists', async () => {
    const mockStack = createMockStack();
    renderComponent({ stack: mockStack, stackFileContent: 'content' });
    await act(async () => {});

    expect(screen.getByText('Create template from stack')).toBeVisible();
  });

  it('should not render StackActions when stack is undefined', () => {
    renderComponent({ stack: undefined });

    expect(
      screen.queryByText('Create template from stack')
    ).not.toBeInTheDocument();
  });

  it('should render stack details section', () => {
    renderComponent();

    expect(screen.getByText('Stack details')).toBeVisible();
  });
});

describe('external and orphaned warnings', () => {
  it('should show external stack warning when isExternal is true', () => {
    renderComponent({ isExternal: true });

    expect(
      screen.getByText(/This stack was created outside of Vessel HQ/i)
    ).toBeVisible();
    expect(screen.getByText('Information')).toBeVisible();
  });

  it('should show orphaned stack warning when isOrphaned is true', () => {
    renderComponent({ isOrphaned: true });

    expect(screen.getByText(/This stack is orphaned/i)).toBeVisible();
    expect(screen.getByText(/Associate to this environment/i)).toBeVisible();
  });

  it('should show orphaned warning when isOrphanedRunning is true', () => {
    renderComponent({ isOrphanedRunning: true, isOrphaned: false });

    expect(screen.getByText(/This stack is orphaned/i)).toBeVisible();
  });

  it('should show orphaned warning when both isOrphaned and isOrphanedRunning are true', () => {
    renderComponent({ isOrphaned: true, isOrphanedRunning: true });

    expect(screen.getByText(/This stack is orphaned/i)).toBeVisible();
  });

  it('should show both warnings when isExternal and isOrphaned are true', () => {
    renderComponent({ isExternal: true, isOrphaned: true });

    expect(
      screen.getByText(/This stack was created outside of Vessel HQ/i)
    ).toBeVisible();
    expect(screen.getByText(/This stack is orphaned/i)).toBeVisible();
  });

  it('should not show warnings when both isExternal and isOrphaned are false', () => {
    renderComponent({ isExternal: false, isOrphaned: false });

    expect(screen.queryByText('Information')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/This stack was created outside of Vessel HQ/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/This stack is orphaned/i)
    ).not.toBeInTheDocument();
  });
});

describe('conditional form rendering', () => {
  it('should render AssociateStackForm when stack is orphaned', async () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      isOrphaned: true,
    });
    await act(async () => {});

    expect(screen.getByText('Associate to this environment')).toBeVisible();
    expect(
      screen.queryByText('Stack duplication / migration')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Managed by Git')).not.toBeInTheDocument();
  });

  it('should not render AssociateStackForm when only isOrphanedRunning is true', async () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      isOrphanedRunning: true,
      isOrphaned: false,
      stackFileContent: 'content',
    });
    await act(async () => {});

    // isOrphanedRunning alone doesn't trigger the form, only isOrphaned does
    expect(
      screen.queryByText('Associate to this environment')
    ).not.toBeInTheDocument();

    expect(screen.getByText('Stack duplication / migration')).toBeVisible();
  });

  it('should render GitReferenceCard when stack has GitConfig and is not from template', async () => {
    const mockStack = createMockStack({
      GitConfig: {
        URL: 'https://github.com/test/repo',
        ReferenceName: 'main',
        ConfigFilePath: 'docker-compose.yml',
        ConfigHash: '',
        TLSSkipVerify: false,
      },
      GitSourceId: 1,
      FromAppTemplate: false,
    });
    renderComponent({
      stack: mockStack,
      isOrphaned: false,
      isRegular: true,
    });

    await waitFor(() => {
      expect(screen.getByText('Managed by Git')).toBeVisible();
    });
  });

  it('should not render GitReferenceCard when stack is from app template', () => {
    const mockStack = createMockStack({
      GitConfig: {
        URL: 'https://github.com/test/repo',
        ReferenceName: 'main',
        ConfigFilePath: 'docker-compose.yml',
        ConfigHash: '',
        TLSSkipVerify: false,
      },
      FromAppTemplate: true,
    });
    renderComponent({
      stack: mockStack,
      isOrphaned: false,
      isRegular: true,
    });

    expect(screen.queryByText('Managed by Git')).not.toBeInTheDocument();
  });

  it('should not render GitReferenceCard when stack has no GitConfig', () => {
    const mockStack = createMockStack({
      GitConfig: undefined,
    });
    renderComponent({
      stack: mockStack,
      isOrphaned: false,
      isRegular: true,
    });

    expect(screen.queryByText('Managed by Git')).not.toBeInTheDocument();
  });

  it('should render StackDuplicationForm when stack is regular and not orphaned and content is available', async () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      isRegular: true,
      isOrphaned: false,
      stackFileContent: 'content',
    });
    await act(async () => {});

    expect(screen.getByText('Stack duplication / migration')).toBeVisible();
  });

  it('should not render StackDuplicationForm when content is not available', () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      isRegular: true,
      isOrphaned: false,
      stackFileContent: '',
    });

    expect(
      screen.queryByText('Stack duplication / migration')
    ).not.toBeInTheDocument();
  });

  it('should not render StackDuplicationForm when stack is not regular', () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      isRegular: false,
      isOrphaned: false,
    });

    expect(
      screen.queryByText('Stack duplication / migration')
    ).not.toBeInTheDocument();
  });

  it('should not render any forms when stack is undefined', () => {
    renderComponent({ stack: undefined });

    expect(
      screen.queryByText('Associate to this environment')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Stack duplication / migration')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Managed by Git')).not.toBeInTheDocument();
  });
});

describe('git and duplication form combination', () => {
  it('should render both GitReferenceCard and StackDuplicationForm when conditions met', async () => {
    const mockStack = createMockStack({
      GitConfig: {
        URL: 'https://github.com/test/repo',
        ReferenceName: 'main',
        ConfigFilePath: 'docker-compose.yml',
        ConfigHash: '',
        TLSSkipVerify: false,
      },
      GitSourceId: 1,
      FromAppTemplate: false,
    });
    renderComponent({
      stack: mockStack,
      isRegular: true,
      isOrphaned: false,
      stackFileContent: 'content',
    });
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByText('Managed by Git')).toBeVisible();
      expect(screen.getByText('Stack duplication / migration')).toBeVisible();
    });
  });
});

describe('stack file content and environment id passing', () => {
  it('should pass stackFileContent to child components', async () => {
    const mockStack = createMockStack();
    const stackFileContent =
      'version: "3"\nservices:\n  web:\n    image: nginx';
    renderComponent({
      stack: mockStack,
      stackFileContent,
      isRegular: true,
    });
    await act(async () => {});

    expect(screen.getByText('Create template from stack')).toBeVisible();
    expect(screen.getByText('Stack duplication / migration')).toBeVisible();
  });

  it('should render stack actions for a different environment id', async () => {
    const mockStack = createMockStack();
    renderComponent({
      stack: mockStack,
      environmentId: 42,
      isRegular: true,
      stackFileContent: 'content',
    });
    await act(async () => {});

    expect(screen.getByText('Create template from stack')).toBeVisible();
  });
});

function renderComponent({
  stack,
  stackName = 'test-stack',
  stackFileContent,
  isRegular = true,
  isExternal = false,
  isOrphaned = false,
  isOrphanedRunning = false,
  environmentId = 1,
  yamlError,
}: Partial<React.ComponentProps<typeof StackInfoTab>> = {}) {
  // Mock the Docker API version endpoint
  server.use(
    http.get('/api/endpoints/:id/docker/version', () =>
      HttpResponse.json({ ApiVersion: '1.41' })
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(StackInfoTab))
  );

  return render(
    <Wrapped
      stack={stack}
      stackName={stackName}
      stackFileContent={stackFileContent}
      isRegular={isRegular}
      isExternal={isExternal}
      isOrphaned={isOrphaned}
      isOrphanedRunning={isOrphanedRunning}
      environmentId={environmentId}
      yamlError={yamlError}
    />
  );
}
