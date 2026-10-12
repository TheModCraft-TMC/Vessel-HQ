export type BrowserPlatform = 'win' | 'mac' | 'lin';

export function getBrowserPlatform(): BrowserPlatform {
  if (typeof navigator === 'undefined') {
    return 'lin';
  }

  if (navigator.userAgent.includes('Windows')) {
    return 'win';
  }

  return navigator.userAgent.includes('Mac') ? 'mac' : 'lin';
}

export const BROWSER_OS_PLATFORM = getBrowserPlatform();
