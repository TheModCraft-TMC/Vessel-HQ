import { FormEvent, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { v4 as uuidv4 } from 'uuid';

import fullLogo from '@/assets/images/vessel-hq-logo.svg';
import darkLogo from '@/assets/images/vessel-hq-logo-dark.svg';
import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { dispatchCacheRefreshEvent } from '@/portainer/services/http-request.helper';
import {
  isSameDocumentUrl,
  isValidReturnUrl,
} from '@/portainer/helpers/url-utils';
import {
  cleanReturnUrl,
  getReturnUrl,
  storeReturnUrl,
} from '@/react/portainer/helpers/returnUrl';
import { notifyError } from '@/portainer/services/notifications';
import { getAppState, initializeAppState } from '@/react/portainer/app-state';
import { getPublicSettings } from '@/react/portainer/settings/settings.service';
import { authStorage } from '@/react/portainer/storage';

import { Button, LoadingButton } from '@@/buttons';
import { Input } from '@@/form-components/Input';

import {
  administratorExists,
  getAuthenticatedUser,
  initializeAuthentication,
  isAdministrator,
  isAuthenticated,
  login,
  loginWithOAuth,
  logout,
} from '../services/auth.service';

export function LoginView() {
  const router = useRouter();
  const { params } = useCurrentStateAndParams();
  const started = useRef(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthLogin, setShowOAuthLogin] = useState(false);
  const [showStandardLogin, setShowStandardLogin] = useState(false);
  const [authenticationError, setAuthenticationError] = useState('');
  const [loginInProgress, setLoginInProgress] = useState(true);
  const [oAuthLoginUri, setOAuthLoginUri] = useState('');
  const [oAuthProvider, setOAuthProvider] = useState('OAuth');
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    void initialize();
    // initialize is intentionally tied to this route instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-wrapper">
      <div className="simple-box container">
        <div className="col-sm-4 col-sm-offset-4">
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

          <div className="row p-5 text-center">
            <p className="text-xl">Log in to your account</p>
            <p className="text-md text-muted font-bold">
              Welcome back! Please enter your details
            </p>
          </div>

          <div className="panel panel-default">
            <div className="panel-body">
              <form
                className="simple-box-form form-horizontal"
                onSubmit={handleLogin}
              >
                {showOAuthLogin && (
                  <div className="form-group">
                    <div className="col-sm-12 flex justify-center">
                      <a
                        className="btn btn-primary btn-lg btn-block"
                        href={oAuthLoginUri}
                        data-cy="auth-oauth-login"
                      >
                        <LogIn className="mr-1 inline h-4 w-4" />
                        Login with {oAuthProvider}
                      </a>
                    </div>
                  </div>
                )}

                {showOAuthLogin && showStandardLogin && (
                  <div className="form-group">
                    <div className="col-sm-12 text-muted text-center">or</div>
                  </div>
                )}

                {showOAuthLogin && !showStandardLogin && (
                  <div className="form-group">
                    <div className="col-sm-12">
                      <Button
                        className="btn-block"
                        onClick={() => setShowStandardLogin(true)}
                        data-cy="auth-use-internal"
                      >
                        Use internal authentication
                      </Button>
                    </div>
                  </div>
                )}

                {showStandardLogin && (
                  <>
                    <label className="block pb-2" htmlFor="username">
                      Username
                    </label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="Enter your username"
                      data-cy="auth-usernameInput"
                    />

                    <label className="block pb-2 pt-4" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="pr-10"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        data-cy="auth-passwordInput"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-0 top-0 flex h-[34px] w-[50px] items-center justify-center border-none bg-transparent"
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        data-cy="auth-passwordInputToggle"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="form-group overflow-auto pt-4">
                      <div className="col-sm-12 flex py-1">
                        <LoadingButton
                          className="btn-block"
                          size="large"
                          isLoading={loginInProgress}
                          loadingText="Login in progress..."
                          data-cy="auth-loginButton"
                        >
                          Login
                        </LoadingButton>
                      </div>
                    </div>
                  </>
                )}
              </form>

              {authenticationError && (
                <p className="text-danger text-right text-sm">
                  {authenticationError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function initialize() {
    try {
      const settings = await getPublicSettings();
      const hasOAuth = settings.AuthenticationMethod === 3;
      setShowOAuthLogin(hasOAuth);
      setShowStandardLogin(!hasOAuth);
      setOAuthProvider(determineOauthProvider(settings.OAuthLoginURI));
      setOAuthLoginUri(generateOAuthLoginUri(settings.OAuthLoginURI));

      const returnUrl = new URLSearchParams(window.location.search).get(
        'returnUrl'
      );
      if (returnUrl && isValidReturnUrl(returnUrl)) {
        storeReturnUrl(returnUrl);
      }

      const code = getUrlParameter('code');
      const oauthState = getUrlParameter('state');
      if (code && oauthState) {
        if (authStorage.getLoginState() !== oauthState) {
          showError(undefined, 'Invalid OAuth state, try again.');
          return;
        }
        await loginWithOAuth(code);
        cleanUrlParameters();
        await postLoginSteps();
        return;
      }

      if (!getAppState().application.logo) {
        await initializeAppState();
      }
      setLogo(getAppState().application.logo);

      if (params.logout || params.error) {
        await logout();
        authStorage.setLogoutReason(String(params.error || ''));
        window.location.reload();
        return;
      }

      const logoutReason = authStorage.getLogoutReason();
      if (logoutReason) {
        setAuthenticationError(logoutReason);
        authStorage.clearLogoutReason();
      }

      dispatchCacheRefreshEvent();
      await initializeAuthentication();
      if (isAuthenticated()) {
        await postLoginSteps();
        return;
      }

      if (!(await administratorExists())) {
        router.stateService.go('portainer.init.admin');
        return;
      }

      setLoginInProgress(false);
    } catch (error) {
      showError(error, 'Unable to retrieve public settings');
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginInProgress(true);
    setAuthenticationError('');

    try {
      await login(username, password);
      await postLoginSteps();
    } catch (error) {
      showError(error, 'Unable to login');
    }
  }

  async function postLoginSteps() {
    await initializeAppState();
    const environments = await getEnvironments({
      limit: 1,
      query: { excludeSnapshots: true },
    });

    if (getAuthenticatedUser()?.forceChangePassword) {
      router.stateService.go('portainer.account');
      return;
    }

    if (!environments.value.length && isAdministrator()) {
      router.stateService.go('portainer.wizard');
      return;
    }

    const returnUrl = getReturnUrl();
    cleanReturnUrl();
    if (
      returnUrl &&
      isValidReturnUrl(returnUrl) &&
      followReturnUrl(returnUrl)
    ) {
      return;
    }

    router.stateService.go('portainer.home');
  }

  function followReturnUrl(returnUrl: string) {
    if (!isSameDocumentUrl(returnUrl)) {
      window.location.href = returnUrl;
      return true;
    }

    const path = new URL(returnUrl, window.location.href).hash.replace(
      /^#!/,
      ''
    );
    if (!path) {
      return false;
    }
    router.urlService.url(path);
    router.urlService.sync();
    return true;
  }

  function generateOAuthLoginUri(baseUri: string) {
    if (!baseUri) {
      return '';
    }
    const state = uuidv4();
    authStorage.setLoginState(state);
    return `${baseUri}&state=${state}`;
  }

  function showError(error: unknown, message: string) {
    setAuthenticationError(message);
    setLoginInProgress(false);
    notifyError('Failure', error, message);
  }
}

function determineOauthProvider(loginUri: string) {
  if (loginUri.includes('login.microsoftonline.com')) {
    return 'Microsoft';
  }
  if (loginUri.includes('accounts.google.com')) {
    return 'Google';
  }
  if (loginUri.includes('github.com')) {
    return 'GitHub';
  }
  return 'OAuth';
}

function getUrlParameter(name: string) {
  return new URL(window.location.href).searchParams.get(name) ?? undefined;
}

function cleanUrlParameters() {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash
  );
}
