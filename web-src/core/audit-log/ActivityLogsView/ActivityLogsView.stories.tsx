import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { TestLayoutProvider } from '@/ui/layouts/layout-context';

import { ActivityLogsView } from './ActivityLogsView';

const entries = Array.from({ length: 45 }, (_, id) => ({
  id,
  timestamp: 1793188800 + id,
  username: id % 2 ? 'alice' : 'bob',
  action: 'POST',
  context: `/example/${id}`,
  payload: btoa(JSON.stringify({ message: 'Example activity' })),
}));

const meta: Meta<typeof ActivityLogsView> = {
  title: 'Console/Activity logs',
  component: ActivityLogsView,
  decorators: [
    (Story) => (
      <TestLayoutProvider overrides={{ user: { Id: 1, Username: 'test' } }}>
        <Story />
      </TestLayoutProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.get('/api/useractivity/logs', ({ request }) => {
          const query = new URL(request.url).searchParams;
          const keyword = query.get('keyword') || '';
          const filtered = entries.filter((entry) =>
            entry.username.includes(keyword)
          );
          const offset = Number(query.get('offset') || 0);
          const limit = Number(query.get('limit') || 10);
          return HttpResponse.json({
            logs: filtered.slice(offset, offset + limit),
            totalCount: filtered.length,
          });
        }),
      ],
    },
  },
};
export default meta;
export const Pagination: StoryObj<typeof ActivityLogsView> = {};
