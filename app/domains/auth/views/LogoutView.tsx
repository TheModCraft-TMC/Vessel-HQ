import { useEffect, useRef, useState } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import {
  cleanReturnUrl,
  darkLogo,
  fullLogo,
  getAppState,
  getPublicSettings,
  notifyError,
} from '@/core/auth';
import { authStorage, getAuthenticatedUser, logout } from '@/domains/auth';
import { clearQueryCache, queryClient } from '@/core/query';

import { LogoutStatus } from '../components/LogoutStatus';

export function LogoutView() {
  const router = useRouter();
  const {
    params: { error = '' },
  } = useCurrentStateAndParams();
  const started = useRef(false);
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    setLogo(getAppState().application.logo);
    const userId = getAuthenticatedUser()?.Id;

    void (async () => {
      try {
        const settings = await getPublicSettings();
        await logout();
        clearQueryCache(queryClient);
        cleanReturnUrl();
        authStorage.setLogoutReason(String(error));

        if (settings.OAuthLogoutURI && userId !== 1) {
          window.location.href = settings.OAuthLogoutURI;
          return;
        }

        router.stateService.go('portainer.auth', { reload: true });
      } catch (logoutError) {
        notifyError('Failure', logoutError, 'An error occurred during logout');
        router.stateService.go('portainer.auth', { reload: true });
      }
    })();
  }, [error, router.stateService]);

  return (
    <div className="page-wrapper">
      <div className="simple-box container">
        <div className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3">
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
          <LogoutStatus />
        </div>
      </div>
    </div>
  );
}
