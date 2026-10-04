'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { buildHref } from '@console/console/routing/buildHref';

import {
  applyTheme,
  cleanReturnUrl,
  getAppState,
  getEnvironments,
  getPublicSettings,
  getReturnUrl,
  initializeAppState,
  isValidReturnUrl,
  notifyError,
  storeReturnUrl,
} from '@/core/auth';
import { clearQueryCache, queryClient } from '@/core/query';
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
import { prepareOAuthLogin } from '@/domains/auth/oauth';

export function useLoginController() {
  const router = useRouter();
  const pathname = usePathname();
  const started = useRef(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthLogin, setShowOAuthLogin] = useState(false);
  // Internal authentication is Portainer's normal login mode. Render it
  // immediately so the original form never collapses to an empty panel while
  // public settings and session restoration are still in flight.
  const [showStandardLogin, setShowStandardLogin] = useState(true);
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
    // Initialization belongs to this route instance and must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    logo,
    formProps: {
      authenticationError,
      loginInProgress,
      oAuthLoginUri,
      oAuthProvider,
      password,
      showOAuthLogin,
      showPassword,
      showStandardLogin,
      username,
      onPasswordChange: setPassword,
      onShowPasswordChange: () => setShowPassword((value) => !value),
      onStandardLogin: () => setShowStandardLogin(true),
      onSubmit: handleLogin,
      onUsernameChange: setUsername,
    },
  };

  async function initialize() {
    try {
      const settings = await getPublicSettings();
      const hasOAuth = settings.AuthenticationMethod === 3;
      setShowOAuthLogin(hasOAuth);
      setShowStandardLogin(!hasOAuth);
      setOAuthProvider(determineOauthProvider(settings.OAuthLoginURI));

      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl =
        searchParams.get('returnUrl') || searchParams.get('returnTo');
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

      if (searchParams.has('logout') || searchParams.has('error')) {
        await logout();
        authStorage.setLogoutReason(searchParams.get('error') || '');
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

      if (await attemptDevelopmentLogin()) {
        await postLoginSteps();
        return;
      }

      if (!(await administratorExists())) {
        router.push(buildHref('/init/admin', {}, pathname));
        return;
      }

      setLoginInProgress(false);
    } catch (error) {
      showError(error, 'Unable to retrieve public settings');
    }
  }

  async function attemptDevelopmentLogin() {
    if (
      process.env.NODE_ENV !== 'development' ||
      process.env.DEV_AUTO_LOGIN !== 'true'
    ) {
      return false;
    }

    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!response.ok) {
      throw new Error('Development auto-login failed');
    }

    return initializeAuthentication();
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
      router.push(buildHref('/account', {}, pathname));
      return;
    }

    if (!environments.value.length && isAdministrator()) {
      router.push(buildHref('/environments/new', {}, pathname));
      return;
    }

    const returnUrl = getReturnUrl();
    cleanReturnUrl();
    if (returnUrl && isValidReturnUrl(returnUrl)) {
      window.location.href = new URL(
        returnUrl,
        window.location.href
      ).toString();
      return;
    }

    router.push(buildHref('/', {}, pathname));
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
  window.history.replaceState({}, document.title, window.location.pathname);
}
