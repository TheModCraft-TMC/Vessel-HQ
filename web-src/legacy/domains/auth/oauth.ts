interface PrepareOAuthLoginOptions {
  authorizationUri: string;
  currentUrl: string;
  storedState: string;
  createState(): string;
}

type OAuthLoginPreparation =
  | { kind: 'login'; loginUri: string; state: string }
  | { kind: 'callback'; code: string }
  | { kind: 'error'; message: string };

export function prepareOAuthLogin({
  authorizationUri,
  currentUrl,
  storedState,
  createState,
}: PrepareOAuthLoginOptions): OAuthLoginPreparation {
  const callback = getOAuthCallback(currentUrl);

  if (callback.error) {
    return {
      kind: 'error',
      message:
        callback.errorDescription ||
        `OAuth provider returned an error: ${callback.error}`,
    };
  }

  if (callback.code || callback.state) {
    if (!callback.code || !callback.state) {
      return { kind: 'error', message: 'Invalid OAuth response, try again.' };
    }

    if (!storedState || storedState !== callback.state) {
      return { kind: 'error', message: 'Invalid OAuth state, try again.' };
    }

    return { kind: 'callback', code: callback.code };
  }

  const state = createState();
  return {
    kind: 'login',
    loginUri: appendOAuthState(authorizationUri, state),
    state,
  };
}

function appendOAuthState(authorizationUri: string, state: string) {
  if (!authorizationUri) {
    return '';
  }

  const url = new URL(authorizationUri);
  url.searchParams.set('state', state);
  return url.toString();
}

function getOAuthCallback(currentUrl: string) {
  const url = new URL(currentUrl);
  function read(name: string) {
    return url.searchParams.get(name) ?? undefined;
  }

  return {
    code: read('code'),
    state: read('state'),
    error: read('error'),
    errorDescription: read('error_description'),
  };
}
