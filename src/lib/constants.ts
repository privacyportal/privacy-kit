export const {
  VITE_HOMEPAGE_URL: HOMEPAGE_URL,
  VITE_AUTHORIZATION_URL: AUTHORIZATION_URL,
  VITE_TOKEN_URL: TOKEN_URL,
  VITE_API_URL: API_URL,
} = import.meta.env;

export const OAUTH = {
  SCOPE: 'openid email',
  RESPONSE_TYPE: 'code',
  RESPONSE_MODE: 'web_message',
};
