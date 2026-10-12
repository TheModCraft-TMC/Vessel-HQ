/**
 * calculates baseHref
 *
 * return [string]
 *
 */
export function baseHref(): string {
  const base = document.getElementById('base');
  return base ? base.getAttribute('href') || '/' : '/';
}
