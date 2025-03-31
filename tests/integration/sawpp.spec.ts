import { test, expect } from '@playwright/test';
import { GET_OAUTH_POPUP_RESPONSE, mockIdToken } from '../mocks/oauth';
import { MOCK_ALIAS } from '../lib/constants';
import {
  validateAuthorizationURL,
  validateTokenReqData,
} from '../lib/oauthHelpers';

test.describe('[Subscribe-Anonymously]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/newsletter', {
      waitUntil: 'load',
    });
    await page.waitForFunction(() => 'PrivacyKit' in window);
  });

  test('Should subscribe user', async ({ page }) => {
    // mock authorization page
    await page.context().route('**/oauth/authorize*', (route) => {
      validateAuthorizationURL(route.request().url());
      route.fulfill(GET_OAUTH_POPUP_RESPONSE);
    });

    // mock token api call
    const id_token = mockIdToken({ email: MOCK_ALIAS });
    await page.route('**/oauth/token', (route) => {
      validateTokenReqData(route.request().postData());
      route.fulfill({
        json: {
          id_token,
          access_token: 'mock_access_token',
        },
      });
    });

    // find subscribe anonymously button
    const button = page.locator(
      'button[data-pp-action="subscribe-anonymously"]',
    );

    // Trigger Subscribe Anonymously
    await button.click();

    // make sure the form is successfully submitted with the alias
    const request = await page.waitForRequest(/\/test\/subscribed/);
    expect(request.method()).toBe('GET');
    const { searchParams } = new URL(request.url());
    expect(Object.fromEntries(searchParams.entries())).toMatchObject({
      'form_fields[email]': MOCK_ALIAS,
    });
  });
});
