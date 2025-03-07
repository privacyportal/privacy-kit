export function parseJwtBody(token: string) {
  const body = token.split('.', 3)[1];
  const bodyObj = JSON.parse(atob(body));
  console.log('JWT', bodyObj);
  return {
    ...bodyObj,
  };
}
