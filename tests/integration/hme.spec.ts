import { test, expect } from '@playwright/test';
import { GET_OAUTH_POPUP_RESPONSE, mockIdToken } from '../mocks/oauth';
import { HME_DATALIST_OPT, MOCK_ALIAS } from '../lib/constants';
import {
  validateAuthorizationURL,
  validateTokenReqData,
} from '../lib/oauthHelpers';

test.describe('[Hide-My-Email]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/signup', {
      waitUntil: 'load',
    });
    await page.waitForFunction(() => 'PrivacyKit' in window);
  });

  test.only('Should auto-fill alias', async ({ page }) => {
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

    // find email input
    const input = page.locator('#form-field-email');

    // ensure the datalist is set
    const datalistId = await input.getAttribute('list');
    expect(datalistId).toMatch(/^pp-[a-fA-F0-9]{8}$/);
    const datalist = page.locator(`#${datalistId}`);
    await expect(datalist).toBeAttached();

    // ensure the datalist HME option is set
    const firstOptionValue = await datalist
      .locator('option')
      .first()
      .getAttribute('value');
    expect(firstOptionValue).toBe(HME_DATALIST_OPT);

    // Trigger HME
    await input.fill('@');

    // make sure the HME alias is auto-filled
    await expect(input).toHaveValue(MOCK_ALIAS);
  });
});
