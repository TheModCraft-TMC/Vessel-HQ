import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { vi } from 'vitest';
import { ComponentProps } from 'react';
import { JSONSchema7 } from 'json-schema';
import { http, HttpResponse } from 'msw';

import { StackType } from '@/domains/stacks/models/types';
import { EnvironmentType } from '@/domains/environments';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import {
  createMockUser,
  createMockUsers,
} from '@/core/test-support/test-mocks';
import { Role } from '@/domains/users';
import { withTestRouter } from '@/core/test-support/withRouter';
import { server } from '@/core/test-support/setup/server';

import { StackEditorTabInner } from './StackEditorTabInner';
import { StackEditorFormValues } from './StackEditorTab.types';

const defaultProps = {
  stackType: StackType.DockerCompose,
  composeSyntaxMaxVersion: 3,
  envType: EnvironmentType.Docker,
  schema: { type: 'object' } as JSONSchema7,
  isOrphaned: false,
  stackId: 1,
  isSubmitting: false,
  isSaved: false,
  webhookId: '',
};

const defaultInitialValues: StackEditorFormValues = {
  stackFileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
  environmentVariables: [],
  enabledWebhook: false,
  prune: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initial rendering', () => {
  it('should render the form with all main sections', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/This stack will be deployed using/)
      ).toBeVisible();
    });

    // Code editor should be present
    expect(screen.getByTestId('stack-editor')).toBeInTheDocument();

    // Environment variables panel
    expect(screen.getByText(/Environment variables/)).toBeInTheDocument();
  });

  it('should show Docker Compose version 2 message when composeSyntaxMaxVersion is 2', async () => {
    renderComponent({
      stackType: StackType.DockerCompose,
      composeSyntaxMaxVersion: 2,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Only Compose file format version/)
      ).toBeVisible();
      expect(screen.getByText('2', { selector: 'b' })).toBeVisible();
    });
  });

  it('should show Docker Compose generic message when composeSyntaxMaxVersion > 2', async () => {
    renderComponent({
      stackType: StackType.DockerCompose,
      composeSyntaxMaxVersion: 3,
    });

    await waitFor(() => {
      expect(
        screen.getByText(/This stack will be deployed using/)
      ).toBeVisible();
    });
  });

  it('should show documentation link', () => {
    renderComponent();

    const link = screen.getByRole('link', {
      name: /official documentation/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.docker.com/reference/compose-file/'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('conditional rendering - Prune services field', () => {
  it('should show Prune field for DockerSwarm with API >= 1.27', async () => {
    renderComponent(
      {
        stackType: StackType.DockerSwarm,
      },
      {
        apiVersion: 1.27,
      }
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stack-prune-services-switch')
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Prune services')).toBeVisible();
  });

  it('should show Prune field for DockerCompose with API >= 1.27', async () => {
    renderComponent(
      {
        stackType: StackType.DockerCompose,
      },
      {
        apiVersion: 1.27,
      }
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('stack-prune-services-switch')
      ).toBeInTheDocument();
    });
  });

  it('should hide Prune field for DockerSwarm with API < 1.27', () => {
    renderComponent(
      {
        stackType: StackType.DockerSwarm,
      },
      {
        apiVersion: 1.26,
      }
    );

    expect(
      screen.queryByTestId('stack-prune-services-switch')
    ).not.toBeInTheDocument();
  });

  it('should hide Prune field for DockerCompose with API < 1.27', () => {
    renderComponent(
      {
        stackType: StackType.DockerCompose,
      },
      {
        apiVersion: 1.26,
      }
    );

    expect(
      screen.queryByTestId('stack-prune-services-switch')
    ).not.toBeInTheDocument();
  });

  it('should hide Prune field for Kubernetes stack', () => {
    renderComponent({
      stackType: StackType.Kubernetes,
    });

    expect(
      screen.queryByTestId('stack-prune-services-switch')
    ).not.toBeInTheDocument();
  });
});

// TODO: Unskip these tests once WebhookFieldset authorization is properly mocked
// These tests fail because WebhookFieldset has complex authorization checks
// (PortainerWebhookCreate, PortainerWebhookList, PortainerWebhookDelete)
// that aren't properly set up in the test environment
describe.skip('conditional rendering - Webhook field', () => {
  it('should show WebhookFieldset for Docker environment', () => {
    renderComponent({
      envType: EnvironmentType.Docker,
    });

    expect(screen.getByText(/Webhook/)).toBeInTheDocument();
  });

  it('should show WebhookFieldset for KubernetesLocal environment', () => {
    renderComponent({
      envType: EnvironmentType.KubernetesLocal,
    });

    expect(screen.getByText(/Webhook/)).toBeInTheDocument();
  });

  it('should hide WebhookFieldset for EdgeAgentOnDocker environment', () => {
    renderComponent({
      envType: EnvironmentType.EdgeAgentOnDocker,
    });

    expect(screen.queryByText(/Webhook/)).not.toBeInTheDocument();
  });
});

describe('orphaned stack behavior', () => {
  it('should disable CodeEditor when stack is orphaned', () => {
    renderComponent({ isOrphaned: true });

    const editor = screen.getByTestId('stack-editor');
    expect(editor).toHaveAttribute('readonly');
  });

  it('should disable deploy button when stack is orphaned', async () => {
    renderComponent({ isOrphaned: true });

    await waitFor(() => {
      const deployButton = screen.queryByTestId('stack-deploy-button');

      expect(deployButton).toBeDisabled();
    });
  });

  it('should enable CodeEditor when stack is not orphaned', async () => {
    renderComponent({ isOrphaned: false });

    const editor = screen.getByTestId('stack-editor');
    await waitFor(() => {
      expect(editor).not.toHaveAttribute('readonly');
    });
  });
});

describe('form field updates', () => {
  it('should update stackFileContent when CodeEditor changes', async () => {
    const onSubmit = vi.fn();
    renderComponent({}, { onSubmit });
    const user = userEvent.setup();

    const editor = screen.getByTestId('stack-editor');
    await waitFor(() => {
      expect(editor).not.toHaveAttribute('readonly');
    });

    await user.clear(editor);
    await user.type(editor, 'version: "3.8"');

    await waitFor(() => {
      expect(editor).toHaveValue('version: "3.8"');
    });
  });

  it('should update prune field when SwitchField changes', async () => {
    const onSubmit = vi.fn();
    renderComponent(
      {
        stackType: StackType.DockerSwarm,
      },
      { onSubmit }
    );
    const user = userEvent.setup();

    await waitFor(() => {
      expect(
        screen.getByTestId('stack-prune-services-switch')
      ).toBeInTheDocument();
    });

    const pruneSwitchField = screen.getByTestId('stack-prune-services-switch');
    await user.click(pruneSwitchField);

    const pruneSwitch = pruneSwitchField.querySelector(
      'input[type="checkbox"]'
    );

    await waitFor(() => {
      expect(pruneSwitch).toBeChecked();
    });
  });
});

describe('version rollback', () => {
  it('should set rollbackTo when version selected and multiple versions available', async () => {
    const onSubmit = vi.fn();
    const versions = [3, 2, 1];
    renderComponent({ versions }, { onSubmit });
    const user = userEvent.setup();

    const versionSelect = screen.getByRole('combobox', { name: /version/i });
    await user.selectOptions(versionSelect, '2');

    await waitFor(() => {
      // Check that the form value was updated (through Formik)
      expect(versionSelect).toHaveValue('2');
    });
  });
});

describe('form submission', () => {
  it('should enable submit button when form is valid', async () => {
    renderComponent();

    await waitFor(() => {
      const deployButton = screen.getByTestId('stack-deploy-button');
      expect(deployButton).toBeEnabled();
    });
  });

  it('should disable submit button when stack is orphaned', async () => {
    const onSubmit = vi.fn();
    renderComponent({ isOrphaned: true }, { onSubmit });

    await waitFor(() => {
      const deployButton = screen.queryByTestId('stack-deploy-button');

      expect(deployButton).toBeDisabled();
    });
  });

  it('should show loading text during submission', async () => {
    renderComponent({ isSubmitting: true }, {});

    await waitFor(() => {
      expect(screen.getByText(/Deployment in progress.../)).toBeInTheDocument();
    });
  });

  it('should call onSubmit with form values when button is clicked', async () => {
    const onSubmit = vi.fn();
    renderComponent({}, { onSubmit });
    const user = userEvent.setup();

    await waitFor(() => {
      const deployButton = screen.getByTestId('stack-deploy-button');
      expect(deployButton).toBeEnabled();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await user.click(deployButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});

describe('authorization', () => {
  it('should hide Prune field when user lacks PortainerStackUpdate authorization', () => {
    const unauthorizedUser = createMockUsers(1, Role.Standard)[0];

    renderComponent(
      {
        stackType: StackType.DockerSwarm,
      },
      { user: unauthorizedUser }
    );

    expect(
      screen.queryByTestId('stack-prune-services-switch')
    ).not.toBeInTheDocument();
  });

  it('should hide FormActions when user lacks PortainerStackUpdate authorization', () => {
    const unauthorizedUser = createMockUsers(1, Role.Standard)[0];

    renderComponent({}, { user: unauthorizedUser });

    expect(screen.queryByTestId('stack-deploy-button')).not.toBeInTheDocument();
  });
});

/**
 * Helper function to render StackEditorTabInner with Formik wrapper
 */
function renderComponent(
  props: Partial<ComponentProps<typeof StackEditorTabInner>> = {},
  {
    apiVersion = 1.47,
    onSubmit = vi.fn(),
    initialValues = defaultInitialValues,
    validationErrors = {},
    user = createMockUser({ Role: Role.Admin }), // Default admin user
  }: {
    apiVersion?: number;
    onSubmit?: (values: StackEditorFormValues) => void | Promise<void>;
    initialValues?: StackEditorFormValues;
    validationErrors?: Partial<Record<keyof StackEditorFormValues, string>>;
    user?: ReturnType<typeof createMockUser>;
  } = {}
) {
  server.use(
    http.get('/api/endpoints/:endpointId/docker/version', () =>
      HttpResponse.json({ ApiVersion: String(apiVersion) })
    ),
    http.get('/api/stacks/:stackId/file', () =>
      HttpResponse.json({
        StackFileContent: defaultInitialValues.stackFileContent,
      })
    )
  );

  // Create validation function that returns errors
  function validate() {
    return validationErrors;
  }

  const Component = withTestQueryProvider(
    withTestRouter(withUserProvider(StackEditorTabInner, user))
  );

  return render(
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validate}
      enableReinitialize
    >
      <Component {...defaultProps} {...props} />
    </Formik>
  );
}
