'use client';

import { Suspense } from 'react';

import { LogoutLogo, useLogout } from '@app/_components/pages/LogoutPage';
import { LogoutStatus } from '@/domains/auth/components/LogoutStatus';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LogoutContent />
    </Suspense>
  );
}

function LogoutContent() {
  const logo = useLogout();

  return (
    <div className="page-wrapper">
      <div className="simple-box container">
        <div className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3">
          <LogoutLogo logo={logo} />
          <LogoutStatus />
        </div>
      </div>
    </div>
  );
}
