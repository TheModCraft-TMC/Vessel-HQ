#!/usr/bin/env node
// Browser companion for platform_smoke.py. Input is an ephemeral JSON object on
// stdin, never command-line credentials. Do not enable traces/HAR/video here.
const fs = require('node:fs');
let stage = 'launch';
let screenshot;
let reportPath;
const checks = {};
function record(key) {
  checks[key] = 'passed';
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(checks));
}
class CheckError extends Error {}

async function assertInteractiveInViewport(locator, label) {
  stage = 'mobile ' + label;
  await locator.waitFor();
  await locator.scrollIntoViewIfNeeded();
  try {
    // Wait for drawer/header transitions and confirm the control receives input.
    await locator.click({ trial: true, timeout: 5000 });
  } catch (error) {
    if (screenshot) await locator.page().screenshot({ path: screenshot.replace(/\.png$/, '-mobile-check-failure.png') });
    const geometry = await locator.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { box: box.toJSON(), pointerEvents: getComputedStyle(element).pointerEvents,
        hitElements: document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2).map(hit => ({ tag: hit.tagName, class: hit.getAttribute('class') })) };
    });
    console.error('Non-secret control geometry: ' + JSON.stringify(geometry));
    throw error;
  }
  if (!(await locator.isEnabled())) throw new CheckError(label + ' is disabled');
  const usable = await locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 &&
      box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1 && element.contains(target);
  });
  if (!usable) {
    if (screenshot) await locator.page().screenshot({ path: screenshot.replace(/\.png$/, '-mobile-check-failure.png') });
    throw new CheckError(label + ' is outside the viewport or covered');
  }
}

async function main() {
  const config = JSON.parse(fs.readFileSync(0, 'utf8'));
  screenshot = config.screenshot;
  reportPath = config.report;
  const { chromium } = require(config.playwrightModule);
  const browser = await chromium.launch(config.chrome ? { executablePath: config.chrome } : {});
  try {
    const context = await browser.newContext({ viewport: { width: 1100, height: 760 } });
    const page = await context.newPage();
    let validation;
    if (config.frontend) {
      stage = 'frontend invalid-state rejection';
      let exchanges = 0;
      page.on('request', request => { if (request.url().includes('/auth/oauth/validate')) exchanges++; });
      await page.goto(config.frontend + '/login?code=untrusted-test-code&state=wrong-state');
      await page.getByText('Invalid OAuth state, try again.', { exact: false }).first().waitFor();
      if (exchanges !== 0) throw new CheckError('Invalid state reached token exchange');
      record('frontend_invalid_state_rejection');
      stage = 'frontend login';
      await page.goto(config.frontend + '/login');
      const oauth = page.locator('[data-cy="auth-oauth-login"]');
      await oauth.waitFor();
      await page.waitForFunction(() => document.querySelector('[data-cy="auth-oauth-login"]')?.getAttribute('href')?.includes('client_id='));
      const box = await oauth.boundingBox();
      if (!box || box.width < 100 || box.height < 30) throw new CheckError('OAuth button layout is broken');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-login.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileBox = await oauth.boundingBox();
      if (!mobileBox || mobileBox.x < 0 || mobileBox.x + mobileBox.width > 390) throw new CheckError('Mobile OAuth button overflows');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new CheckError('Mobile login overflows');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-login-mobile.png') });
      await page.setViewportSize({ width: 1100, height: 760 });
      record('frontend_login_desktop_mobile');
      await oauth.click();
      validation = page.waitForResponse(response => response.url().includes('/auth/oauth/validate'), { timeout: 60000 }).catch(() => null);
    } else {
      stage = 'provider navigation';
      await page.goto(config.authorizeURL);
    }
    stage = 'provider login form';
    await page.locator('input[name="login"]').fill(config.email);
    await page.locator('input[name="password"]').fill(config.password);
    stage = 'provider submit';
    await page.getByRole('button', { name: /log\s*in/i }).click();
    stage = 'callback navigation';
    if (config.frontend) {
      const response = await validation;
      if (!response || response.status() !== 200) throw new CheckError('Frontend code exchange failed');
      const { jwt } = await response.json();
      stage = 'frontend identity and ACL';
      const headers = { Authorization: 'Bearer ' + jwt };
      const identity = await page.request.get(config.frontend + '/api/users/me', { headers });
      const user = await identity.json();
      if (user.Username !== config.email || user.Role !== 2) throw new CheckError('Wrong identity or privilege');
      const settings = await page.request.get(config.frontend + '/api/settings', { headers });
      if (settings.status() !== 403) throw new CheckError('Standard user has admin access');
      record('frontend_real_provider_callback_identity_acl');
      await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 60000 });
      await page.getByRole('navigation').first().waitFor();
      await page.reload();
      await page.getByRole('navigation').first().waitFor();
      await page.getByText(config.email, { exact: true }).first().waitFor();
      await page.getByText('No environments available.', { exact: true }).waitFor();
      record('frontend_cookie_session_reload');
    } else {
      await page.waitForURL(config.callback + '**', { timeout: 60000 });
      stage = 'callback identity and ACL';
      await page.getByRole('heading', { name: 'Real OAuth provider login passed', exact: true }).waitFor();
    }
    if (config.screenshot) {
      // Only the final success document: no passwords, tokens, or login forms.
      await page.screenshot({ path: config.screenshot });
    }
    if (config.frontend) {
      await page.setViewportSize({ width: 390, height: 844 });
      stage = 'mobile drawer and content usability';
      // Sidebar resize handling has a 50ms debounce. Let that complete before
      // explicitly exercising the accessible open/close controls.
      await page.waitForTimeout(100);
      const close = page.getByRole('button', { name: 'Close sidebar', exact: true });
      if (await close.isVisible()) await close.click();
      const expand = page.getByRole('button', { name: 'Expand sidebar', exact: true });
      await expand.waitFor();
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Main navigation"]')?.getBoundingClientRect().right <= 0);
      if (await expand.getAttribute('aria-expanded') !== 'false') throw new CheckError('Sidebar did not close');
      const main = page.getByRole('main');
      const mainBox = await main.boundingBox();
      if (!mainBox || mainBox.x < 0 || mainBox.x + mainBox.width > 391) throw new CheckError('Mobile main content is clipped');
      await main.getByRole('heading', { name: 'Environments', exact: true }).waitFor();
      const search = main.getByPlaceholder('Search environments...');
      await assertInteractiveInViewport(search, 'Environment search');
      await search.fill('isolated-smoke-search');
      if (await search.inputValue() !== 'isolated-smoke-search') throw new CheckError('Environment search is unusable');
      await search.fill('');
      const age = main.getByRole('group', { name: 'Sort by', exact: true }).getByRole('button', { name: /^Age/ });
      await assertInteractiveInViewport(age, 'Environment sort control');
      const previousSort = (await age.textContent()).trim();
      await age.click();
      await page.waitForFunction(previous => document.querySelector('[aria-label="Sort by"] button')?.textContent.trim() !== previous, previousSort);
      await age.click();
      await page.waitForFunction(previous => document.querySelector('[aria-label="Sort by"] button')?.textContent.trim() === previous, previousSort);
      await main.getByText('No environments available.', { exact: true }).waitFor();
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new CheckError('Mobile authenticated page overflows');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-mobile.png') });
      record('mobile_closed_drawer_content_search_sort');
      let pointerFailure;
      try {
        await assertInteractiveInViewport(expand, 'Sidebar expand control');
        await expand.click();
        record('mobile_drawer_pointer_open');
      } catch (error) {
        pointerFailure = error;
        // Continue checking actual drawer behavior through its keyboard control,
        // but retain/rethrow the pointer failure; never convert it into a pass.
        await expand.focus();
        await expand.press('Enter');
      }
      await assertInteractiveInViewport(close, 'Sidebar close control');
      if (await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).getAttribute('aria-expanded') !== 'true') throw new CheckError('Sidebar did not reopen');
      await close.click();
      await close.waitFor({ state: 'hidden' });
      await expand.waitFor();
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Main navigation"]')?.getBoundingClientRect().right <= 0);
      record('mobile_drawer_reopen_close_controls');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-mobile.png') });
      if (pointerFailure) {
        stage = 'mobile Sidebar expand control pointer hit testing';
        throw pointerFailure;
      }
    }
    console.log('Real Dex browser authorization and Vessel callback exchange passed');
  } finally {
    await browser.close();
  }
}
main().catch(error => {
  // Playwright errors often include a URL with an authorization code. Do not log it.
  console.error(`OAuth browser flow failed at ${stage} (credentials and callback URL suppressed)`);
  if (error instanceof CheckError) console.error(error.message);
  checks.failed_stage = stage;
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(checks));
  process.exitCode = 1;
});
