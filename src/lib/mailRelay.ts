import { parseJwtBody } from './tokenUtils.js';
import { authorize } from './oauth.js';
import { AuthorizationOpts } from './config.js';

export async function getUserInfo(
  options?: AuthorizationOpts,
): Promise<{ email?: string; name?: string }> {
  const tokens = await authorize(options);
  if (tokens?.id_token) {
    const { email, name } = parseJwtBody(tokens.id_token);
    return { email, name };
  }
  return {};
}
