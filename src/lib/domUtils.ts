export function delegate<T>(selector: string) {
  return (cb: (targetEl: T) => void) => {
    return (e: Event) => {
      const target = e?.target as HTMLElement;
      if (target) return target.matches(selector) && cb(target as T);
    };
  };
}

export function setInputValue(
  inputEl: HTMLInputElement | null | undefined,
  value: string | null,
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
