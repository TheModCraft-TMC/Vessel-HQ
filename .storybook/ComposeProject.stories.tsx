import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Formik } from 'formik';
import { http, HttpResponse } from 'msw';

import { UploadSection } from '../web-src/domains/stacks/views/CreateView/CreateStackForm/UploadSection/UploadSection';
import type { FormValues } from '../web-src/domains/stacks/views/CreateView/CreateStackForm/types';

const meta = {
  title: 'Workflows/Compose project import',
  component: UploadSection,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.post('/api/stacks/project/inspect', () =>
          HttpResponse.json({
            archiveDigest: `sha256:${'a'.repeat(64)}`,
            manifest: {
              composeFiles: ['compose.yaml', 'overrides/été.yaml'],
              environmentNames: ['APP_TAG'],
            },
            files: {
              'compose.yaml': 'services:\n  app:\n    image: app:${APP_TAG}\n',
              'overrides/été.yaml':
                'services:\n  app:\n    command: echo été\n',
            },
          })
        ),
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <h1>Import Compose project</h1>
        <p>Disposable preview fixture. No engine or deployment is connected.</p>
        <Formik
          initialValues={{ upload: { file: null } } as FormValues}
          onSubmit={() => undefined}
        >
          <Story />
        </Formik>
      </div>
    ),
  ],
} satisfies Meta<typeof UploadSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Compose: Story = { args: { isSwarm: false } };
export const Swarm: Story = { args: { isSwarm: true } };
