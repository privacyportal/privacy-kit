import { parseJwtBody } from './tokenUtils.js';
import { authorize } from './oauth.js';

export async function getAlias() {
  const tokens = await authorize();
  if (tokens?.id_token) {
    const { email } = parseJwtBody(tokens.id_token);
    return email;
  }
}
