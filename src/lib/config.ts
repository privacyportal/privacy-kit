import { AUTHORIZATION_URL, OAUTH } from './constants.js';
import { CustomError } from './errors.js';

export interface ErrorLogger {
  error(message: string): void;
}

export type ErrorHandler = undefined | 'ignore' | 'alert' | ErrorLogger;

export function isErrorLogger(value: any): value is ErrorLogger {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof value.error === 'function'
  );
}

class Config {
  private _client_id: string | undefined;
  private _onError: ErrorHandler;

  get client_id(): string | undefined {
    return this._client_id;
  }

  set client_id(client_id: string) {
    this._client_id = client_id;
  }

  get onError(): ErrorHandler {
    return this._onError;
  }

  set onError(errorHandler: ErrorHandler) {
    this._onError = errorHandler;
  }

  get redirect_uri() {
    return window.location.origin;
  }

  get authorization_origin() {
    return new URL(AUTHORIZATION_URL).origin;
  }

  createAuthorizationURL(state: string, pkceCodeChallenge: string) {
    if (!this.client_id)
      throw new CustomError({ message: 'OAuth client_id not configured.' });
    const authParams = new URLSearchParams();
    authParams.set('client_id', this.client_id);
    authParams.set('scope', OAUTH.SCOPE);
    authParams.set('response_type', OAUTH.RESPONSE_TYPE);
    authParams.set('response_mode', OAUTH.RESPONSE_MODE);
    authParams.set('nonce', crypto.randomUUID().substring(4, 18));
    authParams.set('redirect_uri', this.redirect_uri);
    authParams.set('state', state);
    authParams.set('code_challenge', pkceCodeChallenge);
    authParams.set('code_challenge_method', 'S256');

    const authUrl = new URL(AUTHORIZATION_URL);
    authUrl.search = authParams.toString();

    return authUrl.toString();
  }
}

export default new Config();
