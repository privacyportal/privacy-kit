import { OAUTH_TEST_CODE } from '../lib/constants';

export const GET_OAUTH_POPUP_RESPONSE = {
  status: 200,
  contentType: 'text/html',
  body: `
<!DOCTYPE html>
<html>
  <head>
    <script>
      const searchParams = new URLSearchParams(window.location.hash?.length ? window.location.hash.substring(1) : window.location.search);
      let redirect_uri = searchParams.get('redirect_uri');
      let state = searchParams.get('state');
      window.opener.postMessage({"code":"${OAUTH_TEST_CODE}","state":state}, new URL(redirect_uri).origin);
      window.close();
    </script>
  </head>
  <body>
    <h1>Sign In Auto-Authorization</h1>
  </body>
</html>
`,
};

export function mockIdToken(data: object) {
  return '.' + btoa(JSON.stringify(data)) + '.';
}
