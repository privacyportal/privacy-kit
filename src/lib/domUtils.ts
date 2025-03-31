export function delegate<T>(selector: string, closest?: boolean) {
  return (cb: (targetEl: T) => void) => {
    return (e: Event) => {
      const target = e?.target as HTMLElement;
      if (target)
        return (
          target[closest ? 'closest' : 'matches'](selector) && cb(target as T)
        );
    };
  };
}

export function setInputValue(
  inputEl: HTMLInputElement | null | undefined,
  value: string | null | undefined,
) {
  if (inputEl && value) {
    inputEl.value = value;
    inputEl.dispatchEvent(new Event('paste', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

export function isElementDisplayed(element: HTMLElement): boolean {
  return element.offsetWidth !== 0 || element.offsetHeight !== 0;
}

export function filterEnabledScopes(scopes: string[]): string {
  return scopes.map((scope) => `${scope}:not(:disabled)`).join(', ');
}
