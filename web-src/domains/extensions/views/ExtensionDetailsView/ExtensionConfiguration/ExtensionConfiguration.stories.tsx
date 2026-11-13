import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { http, HttpResponse } from 'msw';

import type { ExtensionRecord } from '../../../models/types';

import { ExtensionConfiguration } from './ExtensionConfiguration';

const extension: ExtensionRecord = {
  id: 907,
  revision: 1,
  status: 'disabled',
  grants: [],
  trustedNativeUI: false,
  updatedAt: 1,
  manifest: {
    id: 'org.example.settings-fixture',
    name: 'Settings fixture',
    version: '1',
    apiVersion: 'v1',
    packageDigest: `sha256:${'a'.repeat(64)}`,
    permissions: [],
  },
};
let version = 2;
let values: Record<string, string> = { theme: 'dark' };
let secretKeys = ['service-token'];

function Fixture({ width }: { width: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ width, maxWidth: '100%', padding: 16 }}>
      <ExtensionConfiguration
        extension={extension}
        disabled={busy}
        onBusyChange={setBusy}
      />
    </div>
  );
}
const meta = {
  title: 'Extensions/Saved settings',
  component: Fixture,
  args: { width: 900 },
  beforeEach: () => {
    version = 2;
    values = { theme: 'dark' };
    secretKeys = ['service-token'];
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/native-extensions/907/settings', () =>
          HttpResponse.json({ version, values, secretKeys })
        ),
        http.put('/api/native-extensions/907/settings', async ({ request }) => {
          const input = (await request.json()) as {
            version: number;
            values: Record<string, string>;
            secrets: Record<string, string | null>;
          };
          if (input.version !== version)
            return HttpResponse.json(
              { message: 'Settings changed' },
              { status: 409 }
            );
          version += 1;
          values = input.values;
          for (const [key, value] of Object.entries(input.secrets)) {
            if (value === null)
              secretKeys = secretKeys.filter((item) => item !== key);
            else if (!secretKeys.includes(key)) secretKeys.push(key);
          }
          return HttpResponse.json({ version, values, secretKeys });
        }),
        http.delete('/api/native-extensions/907/settings', () => {
          version += 1;
          values = {};
          secretKeys = [];
          return HttpResponse.json({ version, values, secretKeys });
        }),
      ],
    },
  },
} satisfies Meta<typeof Fixture>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Narrow: Story = { args: { width: 390 } };
export const SaveAndReset: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Save settings' });
    await userEvent.clear(canvas.getByLabelText('Public value 1'));
    await userEvent.type(canvas.getByLabelText('Public value 1'), 'light');
    await userEvent.type(
      canvas.getByLabelText('Secret value 2'),
      'disposable-fixture-value'
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save settings' })
    );
    await canvas.findByText('Settings saved.');
    await waitFor(() =>
      expect(canvas.getByLabelText('Secret value 2')).toHaveValue('')
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset all settings' })
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Confirm reset' })
    );
    await canvas.findByText('All settings reset.');
    await expect(canvas.getByText('No saved settings.')).toBeVisible();
  },
};
