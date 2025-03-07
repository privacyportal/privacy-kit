import config from './config.js';
import { TOKEN_URL } from './constants.js';
import { CustomError, DEFAULT_ERROR_ACTION, displayError } from './errors.js';
import { bufferToBase64Url, isString } from './stringUtils.js';

const AUTH_ERROR_MESSAGE = [
  'Authentication failed.',
  DEFAULT_ERROR_ACTION,
].join(' ');

function generateRandomState(length = 16) {
  // Generate an array of random integers
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  // Convert the random values to a hexadecimal string
  return Array.from(randomValues, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function generatePKCECodeVerifier(length: number = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToBase64Url(array);
}

async function createPKCECodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64Url(digest);
}

async function exchangeCodeForToken(
  code: string | null,
  pkceCodeVerifier: string,
) {
  try {
    if (!code) throw new CustomError({ message: 'code missing.' });
    if (!config.client_id)
      throw new CustomError({ message: 'OAuth client_id not configured' });

    const params = new URLSearchParams();
    params.set('client_id', config.client_id);
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', config.redirect_uri);
    params.set('code_verifier', pkceCodeVerifier);

    const reponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    return reponse.json();
  } catch (err) {
    if (err instanceof CustomError) throw err;
    throw new CustomError({ message: AUTH_ERROR_MESSAGE });
  }
}

async function validateTokens({
  id_token,
  access_token,
}: {
  id_token: string;
  access_token: string;
}) {
  // validate type
  if (
    !id_token ||
    !access_token ||
    !isString(id_token) ||
    !isString(access_token)
  ) {
    throw new CustomError({ message: AUTH_ERROR_MESSAGE });
  }

  return { id_token, access_token };
}

export async function authorize(): Promise<
  { id_token: string; access_token: string } | undefined
> {
  try {
    // generate state parameter
    const state = generateRandomState();

    // prepare PKCE code_verifier and code_challenge
    const codeVerifier = generatePKCECodeVerifier();
    const codeChallenge = await createPKCECodeChallenge(codeVerifier);

    const authURL = config.createAuthorizationURL(state, codeChallenge);
    const popup = window.open(authURL, 'PrivacyPortalSSO');
    if (!popup)
      throw new CustomError({
        message: 'Popup blocked. Please allow popups for this site.',
      });

    let authTimeout: number | undefined;

    return await Promise.race([
      new Promise((resolve, reject) => {
        window.addEventListener(
          'message',
          async (event) => {
            // Verify the message origin matches the authorization server
            if (event.origin !== config.authorization_origin) return {};

            // Clear the timeout
            clearTimeout(authTimeout);

            const { code, state: returnedState } = event.data;

            // validate state
            if (state !== returnedState)
              return reject(
                new CustomError({ message: 'Authentication failed.' }),
              );

            // exchange code for tokens
            const { id_token, access_token } = await exchangeCodeForToken(
              code,
              codeVerifier,
            ).catch(reject);

            // throws error if invalid
            await validateTokens({ id_token, access_token }).catch(reject);

            resolve({ id_token, access_token });
          },
          false,
        );
      }) as Promise<{ id_token: string; access_token: string }>,
      new Promise((_, reject) => {
        authTimeout = setTimeout(
          () =>
            reject(new CustomError({ message: 'Authorization timed out.' })),
          60000,
        );
      }) as Promise<never>,
    ]);
  } catch (err) {
    displayError(err);
  }
  return;
}
