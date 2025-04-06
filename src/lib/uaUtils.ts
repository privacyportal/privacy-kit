const FIREFOX_UA_STR = 'firefox';
const ANDROID_UA_STR = 'android';

export function uaIncludesAll(navigator: Navigator, items: string[]): boolean {
  const ua = navigator.userAgent.toLowerCase();
  for (const item of items) {
    if (ua.indexOf(item) === -1) return false;
  }
  return true;
}

export function isFirefoxAndroid(navigator: Navigator): boolean {
  return uaIncludesAll(navigator, [FIREFOX_UA_STR, ANDROID_UA_STR]);
}

export function isFirefox(navigator: Navigator): boolean {
  return uaIncludesAll(navigator, [FIREFOX_UA_STR]);
}
