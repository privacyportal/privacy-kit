import { AUTHORIZATION_URL, OAUTH } from './constants.js';
import { CustomError } from './errors.js';

export type AuthorizationOpts = { name_scope_required?: boolean };

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
  private _name_scope_required: boolean | undefined;
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

  get name_scope_required(): boolean {
    return this._name_scope_required || false;
  }

  set name_scope_required(name_scope_required: boolean) {
    this._name_scope_required = name_scope_required;
  }

  get redirect_uri(): string {
    return window.location.origin;
  }

  get authorization_origin(): string {
    return new URL(AUTHORIZATION_URL).origin;
  }

  get authorization_url_placeholder(): string {
    return `${AUTHORIZATION_URL}?loading`;
  }

  getNameScopeRequired(options?: AuthorizationOpts): boolean {
    if (options?.name_scope_required !== undefined)
      return options?.name_scope_required;
    return this.name_scope_required;
  }

  getScope(options?: AuthorizationOpts): string {
    return [
      ...OAUTH.SCOPE,
      ...(this.getNameScopeRequired(options) ? ['name'] : []),
    ].join(' ');
  }

  createAuthorizationURL(
    state: string,
    pkceCodeChallenge: string,
    options?: AuthorizationOpts,
  ) {
    if (!this.client_id)
      throw new CustomError({ message: 'OAuth client_id not configured.' });
    const authParams = new URLSearchParams();
    authParams.set('client_id', this.client_id);
    authParams.set('scope', this.getScope(options));
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
