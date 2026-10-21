import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultBodyType, http, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';

import { server } from '@/core/test-support/setup/server';
import { Stack } from '@/domains/stacks/models/types';
import { EnvironmentType } from '@/domains/environments';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestRouter } from '@/core/test-support/withRouter';
import {
  createMockEnvironment,
  createMockStack,
  createMockUsers,
} from '@/core/test-support/test-mocks';
import { Role } from '@/domains/users';
import { suppressConsoleLogs } from '@/core/test-support/setup/suppress-console';

import { StackEditorTab } from './StackEditorTab';

vi.mock('uuid', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uuid')>()),
  v4: vi.fn(() => 'test-webhook-id-1234'),
}));

vi.mock('@/domains/stacks/components/common/confirm-stack-update', () => ({
  confirmStackUpdate: vi.fn(() =>
    Promise.resolve({ repullImageAndRedeploy: false })
  ),
}));

describe('StackEditorTab - Webhook ID Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get('/api/endpoints/1', () =>
        HttpResponse.json(
          createMockEnvironment({
            Id: 1,
            Type: EnvironmentType.Docker,
            ComposeSyntaxMaxVersion: '3',
          })
        )
      )
    );
  });

  describe('Editor stack with existing webhook', () => {
    it('should display existing webhook ID', async () => {
      const existingWebhookId = 'existing-webhook-123';

      const stack = createMockStack({
        Id: 1,
        Webhook: existingWebhookId,
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      await waitFor(() => {
        const webhookDisplay = screen.queryByRole('textbox', {
          name: /webhook url/i,
        });
        expect(webhookDisplay).toBeInTheDocument();
        expect(webhookDisplay).toHaveTextContent(existingWebhookId);
      });

      expect(vi.mocked(uuidv4)).not.toHaveBeenCalled();
    });
  });

  describe('Editor stack without webhook', () => {
    it('should not display webhook ID and should call uuid once for fallback', async () => {
      vi.clearAllMocks();

      const stack = createMockStack({
        Id: 1,
        Webhook: '',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      const webhookDisplay = screen.queryByRole('textbox', {
        name: /webhook url/i,
      });
      expect(webhookDisplay).not.toBeInTheDocument();

      expect(vi.mocked(uuidv4)).toHaveBeenCalledOnce();
    });
  });

  describe('Form submission', () => {
    it('should send webhook ID in API request when stack has webhook', async () => {
      const restoreConsole = suppressConsoleLogs();

      const user = userEvent.setup();
      let capturedRequestBody: DefaultBodyType;

      server.use(
        http.put('/api/stacks/:id', async ({ request }) => {
          capturedRequestBody = await request.json();
          return HttpResponse.json({ Id: 1, Name: 'test-stack' });
        })
      );

      const stack = createMockStack({
        Id: 1,
        Webhook: 'existing-webhook-123',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      const deployButton = screen.getByTestId('stack-deploy-button');
      await waitFor(() => {
        expect(deployButton).toBeEnabled();
      });

      await user.click(deployButton);

      await waitFor(
        () => {
          expect(capturedRequestBody).toBeDefined();
        },
        { timeout: 3000 }
      );

      assert(capturedRequestBody && typeof capturedRequestBody === 'object');
      expect(capturedRequestBody?.webhook).toBe('existing-webhook-123');

      restoreConsole();
    });

    it('should not send webhook ID in API request when stack has no webhook', async () => {
      const restoreConsole = suppressConsoleLogs();
      const user = userEvent.setup();
      let capturedRequestBody: DefaultBodyType;

      server.use(
        http.put('/api/stacks/:id', async ({ request }) => {
          capturedRequestBody = await request.json();
          return HttpResponse.json({ Id: 1, Name: 'test-stack' });
        })
      );

      const stack = createMockStack({
        Id: 1,
        Webhook: '',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      const deployButton = screen.getByTestId('stack-deploy-button');
      await waitFor(() => {
        expect(deployButton).toBeEnabled();
      });

      await user.click(deployButton);

      await waitFor(
        () => {
          expect(capturedRequestBody).toBeDefined();
        },
        { timeout: 3000 }
      );

      expect(capturedRequestBody).not.toHaveProperty('webhook');
      restoreConsole();
    });
  });
});

function renderComponent({ stack }: { stack: Stack }) {
  const user = createMockUsers(1, Role.Admin)[0];

  const Component = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <StackEditorTab
          stack={stack}
          isOrphaned={false}
          originalFileContent={`services:
  web:
    image: nginx`}
        />
      )),
      user
    )
  );

  return render(<Component />);
}
