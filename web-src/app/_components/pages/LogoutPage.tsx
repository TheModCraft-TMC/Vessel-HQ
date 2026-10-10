'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  cleanReturnUrl,
  darkLogo,
  fullLogo,
  getAppState,
  getPublicSettings,
  notifyError,
} from '@/core/auth';
import { clearQueryCache, queryClient } from '@/core/query';
import { authStorage, getAuthenticatedUser, logout } from '@/domains/auth';

export function useLogout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || '';
  const started = useRef(false);
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setLogo(getAppState().application.logo);
    const userId = getAuthenticatedUser()?.Id;

    void (async () => {
      try {
        const settings = await getPublicSettings();
        await logout();
        clearQueryCache(queryClient);
        cleanReturnUrl();
        authStorage.setLogoutReason(error);

        if (settings.OAuthLogoutURI && userId !== 1) {
          window.location.href = settings.OAuthLogoutURI;
          return;
        }
      } catch (logoutError) {
        notifyError('Failure', logoutError, 'An error occurred during logout');
      }
      router.replace('/login');
    })();
  }, [error, router]);

  return logo;
}

export function LogoutLogo({ logo }: { logo?: string }) {
  return (
    <div className="row">
      {logo ? (
        <img src={logo} className="simple-box-logo" alt="Vessel HQ" />
      ) : (
        <>
          <img
            src={fullLogo}
            className="simple-box-logo hidden th-highcontrast:!block th-dark:!block"
            alt="Vessel HQ"
          />
          <img
            src={darkLogo}
            className="simple-box-logo block th-highcontrast:hidden th-dark:hidden"
            alt="Vessel HQ"
          />
        </>
      )}
    </div>
  );
}
