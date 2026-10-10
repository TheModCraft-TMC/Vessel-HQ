import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { LegacyClientSetup } from '@console/LegacyClientSetup';
import { MainLayout } from '@console/layout/MainLayout';

import './next-globals.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'toastr/build/toastr.css';
import 'spinkit/spinkit.min.css';
import '@reach/menu-button/styles.css';
import '@xterm/xterm/css/xterm.css';
import '../legacy/assets/css/rdash.css';
import '../legacy/assets/css/app.css';
import '../legacy/assets/css/theme.css';
import '../legacy/ui/tokens/tokens.css';
import '../legacy/assets/css/vendor-override.css';
import '../legacy/assets/css/bootstrap-override.css';
import '../legacy/assets/css/icon.css';
import '../legacy/assets/css/button.css';
import '../legacy/assets/css/react-datetime-picker-override.css';
import '../legacy/domains/ingress/ingresses/style.css';

export const metadata: Metadata = {
  title: {
    default: 'Vessel HQ',
    template: '%s | Vessel HQ',
  },
  description: 'Container management with Vessel HQ',
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

// A nonce must be generated for every HTML response. Static prerendering would
// reuse HTML without the request nonce and CSP would block Next.js hydration.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LegacyClientSetup />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
