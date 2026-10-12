const SENSITIVE_HEADER_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-portainer.*)$/i;

function sanitizeHeaders(headers: Record<string, string | null | undefined>) {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      SENSITIVE_HEADER_PATTERN.test(name) ? null : value,
    ])
  );
}

if (process.env.NODE_ENV === 'development') {
  void import('logrocket')
    .then(({ default: LogRocket }) => {
      LogRocket.init('rxvbiv/vesselhq', {
        shouldCaptureIP: false,
        browser: {
          urlSanitizer(url) {
            const sanitizedUrl = new URL(url, window.location.origin);
            sanitizedUrl.search = '';
            sanitizedUrl.hash = '';
            return sanitizedUrl.toString();
          },
        },
        dom: {
          inputSanitizer: true,
        },
        network: {
          requestSanitizer(request) {
            return {
              ...request,
              body: null,
              headers: sanitizeHeaders(request.headers),
            };
          },
          responseSanitizer(response) {
            return {
              ...response,
              body: null,
              headers: sanitizeHeaders(response.headers),
            };
          },
        },
      });
      return undefined;
    })
    .catch(() => {
      // Observability must never prevent the development app from starting.
    });
}
