import { expect } from '@playwright/test';
import { PORT } from './constants';

export function getSearchParams(url: URL) {
  return url.hash?.length
    ? new URLSearchParams(url?.hash.substring(1))
    : url.searchParams;
}

export function validateAuthorizationURLSearchParams(
  searchParams: URLSearchParams,
  opts?: { scope?: string },
) {
  for (const key of ['client_id', 'nonce', 'state', 'code_challenge']) {
    expect(
      searchParams.has(key),
      `authorization URL must have param "${key}".`,
    ).toBeTruthy();
  }

  expect(Object.fromEntries(searchParams.entries())).toMatchObject({
    scope: opts?.scope || 'openid email',
    response_type: 'code',
    response_mode: 'web_message',
    redirect_uri: `http://localhost:${PORT}`,
    code_challenge_method: 'S256',
  });
}

export function validateTokenReqData(data: string | null) {
  expect(data).not.toBeNull();

  if (data) {
    const searchParams = new URLSearchParams(data);

    for (const key of ['client_id', 'code_verifier']) {
      expect(searchParams.get(key)).toBeDefined();
    }

    expect(Object.fromEntries(searchParams.entries())).toMatchObject({
      grant_type: 'authorization_code',
      code: 'TEST_CODE',
      redirect_uri: `http://localhost:${PORT}`,
    });
  }
}
