const FIREFOX_UA_STR = 'firefox';
const ANDROID_UA_STR = 'android';
const SAFARI_UA_STR = 'safari';
const CHROME_UA_STR = 'chrome';
const CHROMIUM_UA_STR = 'chromium';
const CHROME_IOS_UA_STR = 'criOS';

export function uaIncludesAll(navigator: Navigator, items: string[]): boolean {
  const ua = navigator.userAgent.toLowerCase();
  for (const item of items) {
    if (ua.indexOf(item) === -1) return false;
  }
  return true;
}

export function uaIncludesAny(navigator: Navigator, items: string[]): boolean {
  const ua = navigator.userAgent.toLowerCase();
  for (const item of items) {
    if (ua.indexOf(item) > -1) return true;
  }
  return false;
}

export function isFirefoxAndroid(navigator: Navigator): boolean {
  return uaIncludesAll(navigator, [FIREFOX_UA_STR, ANDROID_UA_STR]);
}

export function isFirefox(navigator: Navigator): boolean {
  return uaIncludesAll(navigator, [FIREFOX_UA_STR]);
}

export function isSafari(navigator: Navigator): boolean {
  return (
    uaIncludesAll(navigator, [SAFARI_UA_STR]) &&
    !uaIncludesAny(navigator, [
      CHROME_UA_STR,
      CHROMIUM_UA_STR,
      CHROME_IOS_UA_STR,
    ])
  );
}
