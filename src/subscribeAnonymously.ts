import { EMAIL_INPUT_SCOPES } from './hideMyEmail';
import { delegate, setInputValue } from './lib/domUtils';
import { displayError } from './lib/errors';
import { getAlias } from './lib/mailRelay';

const SUB_ANON_BUTTON_SCOPES = [
  'form button[data-pp-action=subscribe-anonymously]',
];

const ACTIONABLE_SUB_ANON_BUTTON_SCOPE = SUB_ANON_BUTTON_SCOPES.map(
  (scope) => `${scope}:not(:disabled)`,
).join(', ');

const EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map(
  (scope) => `${scope}:not(:disabled)`,
).join(', ');

const buttonDelegate = delegate<HTMLButtonElement>(
  ACTIONABLE_SUB_ANON_BUTTON_SCOPE,
);

async function handleSubscribeEvent(buttonElement: HTMLButtonElement) {
  try {
    const formEl = buttonElement.closest('form');
    if (!formEl) return;

    const emailInputEl = formEl.querySelector(
      EMAIL_INPUT_SCOPE,
    ) as HTMLInputElement | null;

    if (setInputValue(emailInputEl, await getAlias())) {
      if (formEl.dispatchEvent(new Event('submit', { cancelable: true }))) {
        formEl.submit();
      }
    }
  } catch (err) {
    displayError(err);
  }
}

function listenToButtonPress(containerElement: HTMLElement | Document) {
  if (containerElement?.addEventListener) {
    containerElement.addEventListener(
      'click',
      buttonDelegate((buttonElement: HTMLButtonElement) => {
        handleSubscribeEvent(buttonElement);
      }),
      true,
    );
  }
}

export function enableSubscribeAnonymously() {
  window.addEventListener('load', () => {
    listenToButtonPress(document);
  });
}
