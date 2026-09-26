import { FormEvent, useEffect, useRef, useState } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { v4 as uuidv4 } from 'uuid';

import {
  applyTheme,
  darkLogo,
  fullLogo,
  getAppState,
  getEnvironments,
  getPublicSettings,
  initializeAppState,
  cleanReturnUrl,
  getReturnUrl,
  isSameDocumentUrl,
  isValidReturnUrl,
  notifyError,
  storeReturnUrl,
} from '@/core/auth';
import {
  administratorExists,
  authStorage,
  getAuthenticatedUser,
  initializeAuthentication,
  isAdministrator,
  isAuthenticated,
  login,
  loginWithOAuth,
  logout,
} from '@/domains/auth';
import { clearQueryCache, queryClient } from '@/core/query';

import { LoginForm } from '../components/LoginForm';
import { prepareOAuthLogin } from '../oauth';

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
              <LoginForm
                authenticationError={authenticationError}
                loginInProgress={loginInProgress}
                oAuthLoginUri={oAuthLoginUri}
                oAuthProvider={oAuthProvider}
                password={password}
                showOAuthLogin={showOAuthLogin}
                showPassword={showPassword}
                showStandardLogin={showStandardLogin}
                username={username}
                onPasswordChange={setPassword}
                onShowPasswordChange={() => setShowPassword((value) => !value)}
                onStandardLogin={() => setShowStandardLogin(true)}
                onSubmit={handleLogin}
                onUsernameChange={setUsername}
              />
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

      const returnUrl = new URLSearchParams(window.location.search).get(
        'returnUrl'
      );
      if (returnUrl && isValidReturnUrl(returnUrl)) {
        storeReturnUrl(returnUrl);
      }

      if (hasOAuth) {
        const oauth = prepareOAuthLogin({
          authorizationUri: settings.OAuthLoginURI,
          currentUrl: window.location.href,
          storedState: authStorage.getLoginState(),
          createState: uuidv4,
        });

        if (oauth.kind === 'callback' || oauth.kind === 'error') {
          authStorage.clearLoginState();
          cleanUrlParameters();
        }

        if (oauth.kind === 'error') {
          showError(undefined, oauth.message);
          return;
        }

        if (oauth.kind === 'callback') {
          await loginWithOAuth(oauth.code);
          await postLoginSteps();
          return;
        }

        authStorage.setLoginState(oauth.state);
        setOAuthLoginUri(oauth.loginUri);
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

      clearQueryCache(queryClient);
      const restored = await initializeAuthentication();
      const user = restored ? getAuthenticatedUser() : undefined;
      if (user) {
        applyTheme(user.ThemeSettings.color);
      }
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
      await login({ username, password });
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

function cleanUrlParameters() {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash
  );
}
