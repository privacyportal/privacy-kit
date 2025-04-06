export function delegate<T>(
  selector: string,
  opts?: { closest?: boolean; shadow?: boolean },
) {
  return (cb: (targetEl: T) => void) => {
    return (e: Event) => {
      const target = (
        opts?.shadow ? e?.composedPath()?.[0] : e?.target
      ) as HTMLElement;
      if (target)
        return (
          target[opts?.closest ? 'closest' : 'matches'](selector) &&
          cb(target as T)
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

export function bindVisibilityToInputFocus(
  inputElement: HTMLInputElement,
  elementToBind: HTMLElement,
) {
  // handle show and hide
  inputElement.addEventListener('focusin', () => {
    elementToBind.style.visibility = 'visible';
  });

  // handle focusout using click event to ensure lists have precedence
  document.addEventListener(
    'click',
    (e) => {
      if (elementToBind.style.visibility === 'visible') {
        const rect = inputElement.getBoundingClientRect();
        if (
          e.clientY < rect.top ||
          e.clientY > rect.bottom ||
          e.clientX < rect.left ||
          e.clientX > rect.right
        ) {
          elementToBind.style.visibility = 'hidden';
        }
      }
    },
    true,
  );
}

export function bindAbsolutePositionToViewPort(updatePosition: () => void) {
  updatePosition();
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', updatePosition);
  } else {
    (window as Window).addEventListener('resize', updatePosition);
  }
}
