import { useEffect } from 'react';
import '../web-src/app/next-globals.css';
import '../web-src/shared/assets/vendor/bootstrap-3/bootstrap.css';
import 'toastr/build/toastr.css';
import 'spinkit/spinkit.min.css';
import '../web-src/shared/assets/css/rdash.css';
import '../web-src/shared/assets/css/app.css';
import '../web-src/shared/assets/css/theme.css';
import '../web-src/ui/tokens/tokens.css';
import '../web-src/shared/assets/css/vendor-override.css';
import '../web-src/shared/assets/css/bootstrap-override.css';
import '../web-src/shared/assets/css/icon.css';
import '../web-src/shared/assets/css/button.css';
import '../web-src/shared/assets/css/react-datetime-picker-override.css';
import { withTestRouter } from '../web-src/core/test-support/withRouter';
import { initialize as initMSW, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../web-src/core/test-support/setup/server-handlers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Preview } from '@storybook/react';

initMSW(
  {
    onUnhandledRequest: ({ method, url }) => {
      if (url.startsWith('/api')) {
        console.error(`Unhandled ${method} request to ${url}.

        This exception has been only logged in the console, however, it's strongly recommended to resolve this error as you don't want unmocked data in Storybook stories.

        If you wish to mock an error response, please refer to this guide: https://mswjs.io/docs/recipes/mocking-error-responses
      `);
      }
    },
  },
  handlers
);

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Vessel color theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'highcontrast', title: 'High Contrast', icon: 'eye' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: (Story, context) => {
    const theme = context.globals.theme;

    useEffect(() => {
      if (theme === 'light') {
        document.documentElement.removeAttribute('theme');
      } else {
        document.documentElement.setAttribute('theme', theme);
      }
    }, [theme]);

    const StoryWithProviders = withTestRouter(Story);

    return (
      <QueryClientProvider client={testQueryClient}>
        <StoryWithProviders />
      </QueryClientProvider>
    );
  },
  loaders: [mswLoader],
  parameters: {
    nextjs: { appDirectory: true },
    options: {
      storySort: {
        order: ['Design System', 'Components', '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    msw: {
      handlers,
    },
  },
};

export default preview;
