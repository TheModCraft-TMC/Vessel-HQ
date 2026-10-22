import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { LegacyClientSetup } from '@console/LegacyClientSetup';

import './next-globals.css';
import '../shared/assets/vendor/bootstrap-3/bootstrap.css';
import 'toastr/build/toastr.css';
import 'spinkit/spinkit.min.css';
import '../shared/assets/css/rdash.css';
import '../shared/assets/css/app.css';
import '../shared/assets/css/theme.css';
import '../ui/tokens/tokens.css';
import '../shared/assets/css/vendor-override.css';
import '../shared/assets/css/bootstrap-override.css';
import '../shared/assets/css/icon.css';
import '../shared/assets/css/button.css';
import '../shared/assets/css/react-datetime-picker-override.css';
import '../domains/ingress/ingresses/style.css';

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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <LegacyClientSetup />
        {children}
      </body>
    </html>
  );
}
