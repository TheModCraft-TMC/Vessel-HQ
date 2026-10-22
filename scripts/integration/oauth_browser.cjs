#!/usr/bin/env node
// Browser companion for platform_smoke.py. Input is an ephemeral JSON object on
// stdin, never command-line credentials. Do not enable traces/HAR/video here.
const fs = require('node:fs');
let stage = 'launch';

async function main() {
  const config = JSON.parse(fs.readFileSync(0, 'utf8'));
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
      if (exchanges !== 0) throw new Error('Invalid state reached token exchange');
      stage = 'frontend login';
      await page.goto(config.frontend + '/login');
      const oauth = page.locator('[data-cy="auth-oauth-login"]');
      await oauth.waitFor();
      await page.waitForFunction(() => document.querySelector('[data-cy="auth-oauth-login"]')?.getAttribute('href')?.includes('client_id='));
      const box = await oauth.boundingBox();
      if (!box || box.width < 100 || box.height < 30) throw new Error('OAuth button layout is broken');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-login.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileBox = await oauth.boundingBox();
      if (!mobileBox || mobileBox.x < 0 || mobileBox.x + mobileBox.width > 390) throw new Error('Mobile OAuth button overflows');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Mobile login overflows');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-login-mobile.png') });
      await page.setViewportSize({ width: 1100, height: 760 });
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
      if (!response || response.status() !== 200) throw new Error('Frontend code exchange failed');
      const { jwt } = await response.json();
      stage = 'frontend identity and ACL';
      const headers = { Authorization: 'Bearer ' + jwt };
      const identity = await page.request.get(config.frontend + '/api/users/me', { headers });
      const user = await identity.json();
      if (user.Username !== config.email || user.Role !== 2) throw new Error('Wrong identity or privilege');
      const settings = await page.request.get(config.frontend + '/api/settings', { headers });
      if (settings.status() !== 403) throw new Error('Standard user has admin access');
      await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 60000 });
      await page.getByRole('navigation').first().waitFor();
      await page.reload();
      await page.getByRole('navigation').first().waitFor();
      await page.getByText(config.email, { exact: true }).first().waitFor();
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
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Mobile authenticated page overflows');
      if (config.screenshot) await page.screenshot({ path: config.screenshot.replace(/\.png$/, '-mobile.png') });
    }
    console.log('Real Dex browser authorization and Vessel callback exchange passed');
  } finally {
    await browser.close();
  }
}
main().catch(() => {
  // Playwright errors often include a URL with an authorization code. Do not log it.
  console.error(`OAuth browser flow failed at ${stage} (credentials and callback URL suppressed)`);
  process.exitCode = 1;
});
