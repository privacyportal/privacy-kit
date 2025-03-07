export function bufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  const uint8Array =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...uint8Array));
}

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array) {
  return base64ToBase64Url(bufferToBase64(buffer));
}

export function base64ToBase64Url(input: string) {
  return input.replace(/\//g, '_').replace(/\+/g, '-').replace(/=+$/, '');
}

export function isString(input: any): boolean {
  return typeof input === 'string' || input instanceof String;
}
