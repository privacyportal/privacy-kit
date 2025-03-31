import { AuthorizationOpts } from './lib/config.js';
import { EMAIL_INPUT_SCOPES, TEXT_INPUT_SCOPE } from './hideMyEmail';
import {
  delegate,
  filterEnabledScopes,
  isElementDisplayed,
  setInputValue,
} from './lib/domUtils';
import { displayError } from './lib/errors';
import { getUserInfo } from './lib/mailRelay';

const SUB_ANON_BUTTON_SCOPES = [
  'form button[data-pp-action=subscribe-anonymously]',
];

const ACTIONABLE_SUB_ANON_BUTTON_SCOPE = filterEnabledScopes(
  SUB_ANON_BUTTON_SCOPES,
);
const EMAIL_INPUT_SCOPE = filterEnabledScopes(EMAIL_INPUT_SCOPES);
const NAME_INPUT_SCOPES = filterEnabledScopes([
  `${TEXT_INPUT_SCOPE}[id*=name]`,
  `${TEXT_INPUT_SCOPE}[name*=name]`,
]);

const buttonDelegate = delegate<HTMLButtonElement>(
  ACTIONABLE_SUB_ANON_BUTTON_SCOPE,
  true,
);

async function handleSubscribeEvent(buttonElement: HTMLButtonElement) {
  try {
    const formEl = buttonElement.closest('form');
    if (!formEl) return;

    const emailInputEl = [
      ...Array.from(
        formEl.querySelectorAll<HTMLInputElement>(EMAIL_INPUT_SCOPE),
      ),
    ].find(isElementDisplayed);
    if (!emailInputEl) return;

    const nameInputEl = [
      ...Array.from(
        formEl.querySelectorAll<HTMLInputElement>(NAME_INPUT_SCOPES),
      ),
    ].find(isElementDisplayed);

    let authorizationOpts: undefined | AuthorizationOpts;
    if (nameInputEl?.required) {
      authorizationOpts = { name_scope_required: true };
    }

    const { email, name } = await getUserInfo(authorizationOpts);

    if (
      setInputValue(emailInputEl, email) &&
      (!nameInputEl || !name || setInputValue(nameInputEl, name))
    ) {
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
