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
  inputElement.addEventListener('focusin', () => {
    elementToBind.style.opacity = '1';
  });

  inputElement.addEventListener('focusout', () => {
    elementToBind.style.opacity = '0';
  });

  // handle click events also
  document.addEventListener(
    'click',
    () => {
      elementToBind.style.opacity =
        document.activeElement === (inputElement as Element) ? '1' : '0';
    },
    true,
  );
}

export async function attachShadowDomToFirstCompatibleAncestor(
  element: Element,
): Promise<{
  ancestor: HTMLElement;
  shadowRoot: ShadowRoot;
}> {
  let ancestor = element.parentElement;
  let shadowRoot;
  while (ancestor) {
    try {
      shadowRoot =
        ancestor.shadowRoot || ancestor.attachShadow({ mode: 'open' });

      // style
      const style = document.createElement('style');
      style.textContent = `:host{position:relative;display:block;box-sizing:border-box;margin:0;padding:0;}`;

      // Preserve original input in light DOM
      const slot = document.createElement('slot');

      shadowRoot.append(style, slot);
    } catch {
      /* do nothing */
    }

    if (shadowRoot) return { ancestor, shadowRoot };
    ancestor = ancestor.parentElement;
  }
  throw new Error('Failed to attach HME DOM.');
}

export function bindShadowElementPosition(
  inputElement: HTMLInputElement,
  ancestor: Element,
  updatePosition: FrameRequestCallback,
) {
  let animationFrame: number = 0;
  const debouncedUpdate = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updatePosition);
  };

  // Handle dynamic updates
  const observer = new ResizeObserver(debouncedUpdate);
  observer.observe(inputElement);
  observer.observe(ancestor);

  // cleanup the observer at GC time
  const registry = new FinalizationRegistry((observer: ResizeObserver) => {
    observer.unobserve(inputElement);
    observer.unobserve(ancestor);
    observer.disconnect();
  });

  const weakRef = new WeakRef(inputElement);
  registry.register(weakRef, observer);
}

export function fmtPixelDimension(amount: number, opts?: { toFixed?: number }) {
  return (opts?.toFixed ? amount.toFixed(opts.toFixed) : amount) + 'px';
}
