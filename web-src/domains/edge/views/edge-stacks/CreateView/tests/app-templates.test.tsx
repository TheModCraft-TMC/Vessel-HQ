import { DefaultBodyType, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { http, server } from '@/core/test-support/setup/server';
import selectEvent from '@/core/test-support/react-select';
import { mockCodeMirror } from '@/core/test-support/setup/mock-codemirror';
import { configureTestNavigation } from '@/core/test-support/next-navigation';

import { renderCreateForm } from './utils.test';

// browser address
// /edge/stacks/new?templateId=54&templateType=app
mockCodeMirror();

// expected form values
const expectedAppTemplatePayload = {
  deploymentType: 0,
  edgeGroups: [1],
  name: 'my-stack',
  envVars: [{ name: 'LICENSE_KEY', value: 'license-123' }],
  prePullImage: false,
  registries: [],
  retryDeploy: false,
  staggerConfig: {
    StaggerOption: 1,
    StaggerParallelOption: 1,
    DeviceNumber: 1,
    DeviceNumberStartFrom: 0,
    DeviceNumberIncrementBy: 2,
    Timeout: '',
    UpdateDelay: '',
    UpdateFailureAction: 1,
  },
  useManifestNamespaces: false,
  stackFileContent:
    // eslint-disable-next-line no-template-curly-in-string
    'version: "3.7"\nservices:\n  tosibox-lock-for-container:\n    container_name: tosibox-lock-for-container\n    image: tosibox/lock-for-container:latest\n    hostname: tb-lfc\n    restart: unless-stopped\n    cap_add:\n      - NET_ADMIN\n      - SYS_TIME\n      - SYS_PTRACE\n    ports:\n      - 80\n    networks:\n      - tbnet\n    volumes:\n      - tosibox-lfc:/etc/tosibox/docker_volume\n    environment:\n      - LICENSE_KEY=${LICENSE_KEY}\nvolumes:\n  tosibox-lfc:\n    name: tosibox-lfc\nnetworks:\n  tbnet:\n    name: tbnet\n    ipam:\n      config:\n        - subnet: 10.10.206.0/24\n',
};

test('The web editor should be visible for app templates', async () => {
  setMockCreateStackUrlParams(54, 'app');
  const { getByRole, getByLabelText } = renderCreateForm();

  // Wait for the form to be rendered
  await waitFor(() => {
    expect(getByRole('form')).toBeInTheDocument();
  });

  // the web editor should be visible
  expect(getByLabelText('Web editor')).toBeVisible();
});

test('The form should submit the correct request body for a given app template', async () => {
  setMockCreateStackUrlParams(54, 'app');
  let requestBody: DefaultBodyType;
  server.use(
    http.post('/api/edge_stacks/create/string', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({});
    })
  );

  const { findByRole, getByRole, getByLabelText } = renderCreateForm();

  await waitFor(() => {
    expect(getByRole('form')).toBeInTheDocument();
  });

  // fill in the name and select the docker edge group
  const user = userEvent.setup();
  await user.type(getByRole('textbox', { name: 'Name *' }), 'my-stack');
  await user.type(
    await findByRole('textbox', { name: 'License key' }),
    'license-123'
  );
  const selectElement = getByLabelText('Edge groups');
  await selectEvent.select(selectElement, 'docker');

  // submit the form
  await user.click(getByRole('button', { name: /Deploy the stack/i }));

  // verify the request body
  await waitFor(() => {
    expect(requestBody).toEqual(expectedAppTemplatePayload);
  });
});

function setMockCreateStackUrlParams(templateId: number, templateType: string) {
  configureTestNavigation({
    pathname: '/edge/stacks/new',
    searchParams: { templateId, templateType },
  });
}
