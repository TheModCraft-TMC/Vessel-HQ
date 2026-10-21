import { useEffect, useState } from 'react';

export type CopyTextType = string | (() => string);

export function useCopy(
  copyText: CopyTextType,
  fadeDelay = 1000,
  context: HTMLElement = document.body
) {
  const [copiedSuccessfully, setCopiedSuccessfully] = useState(false);

  useEffect(() => {
    const fadeoutTime = setTimeout(
      () => setCopiedSuccessfully(false),
      fadeDelay
    );
    // clear timeout when component unmounts
    return () => {
      clearTimeout(fadeoutTime);
    };
  }, [copiedSuccessfully, fadeDelay]);

  async function handleCopy() {
    const text = typeof copyText === 'function' ? copyText() : copyText;

    if (!text) {
      return;
    }

    setCopiedSuccessfully(false);
    // eslint-disable-next-line no-restricted-properties -- this file IS the approved secure-context-safe wrapper; consumers must use useCopy or CopyButton
    if (window.isSecureContext && navigator.clipboard) {
      try {
        // eslint-disable-next-line no-restricted-properties -- see above
        await navigator.clipboard.writeText(text);
        setCopiedSuccessfully(true);
        return;
      } catch {
        // Clipboard permissions may be denied even in a secure context.
        // Try the same fallback used for HTTP deployments.
      }
    }

    const inputEl = document.createElement('textarea');
    inputEl.value = text;
    try {
      context.appendChild(inputEl);
      inputEl.select();
      setCopiedSuccessfully(document.execCommand('copy'));
    } catch {
      setCopiedSuccessfully(false);
    } finally {
      inputEl.remove();
    }
  }

  return { handleCopy, copiedSuccessfully };
}
