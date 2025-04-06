import {
  bindAbsolutePositionToViewPort,
  bindVisibilityToInputFocus,
  delegate,
  isElementDisplayed,
  setInputValue,
} from './lib/domUtils.js';
import { displayError } from './lib/errors.js';
import { getUserInfo } from './lib/mailRelay.js';
import hmeLogo from './lib/assets/hmeLogo.js';
import { isFirefoxAndroid, isFirefox } from './lib/uaUtils.js';

let detectedInput: HTMLInputElement;

const DATALIST_SUGGESTION = '*****@pportal.io';
const HME_LABEL = 'Hide my Email';

export const TEXT_INPUT_SCOPE = 'input[type=text]';
export const EMAIL_INPUT_SCOPES = [
  `input[type=email]`,
  `${TEXT_INPUT_SCOPE}[id*="email" i]`,
  `${TEXT_INPUT_SCOPE}[name*="email" i]`,
  `${TEXT_INPUT_SCOPE}[name*="username" i]`,
  `${TEXT_INPUT_SCOPE}[name*="login" i]`,
  `${TEXT_INPUT_SCOPE}[placeholder*="email" i]`,
  `${TEXT_INPUT_SCOPE}[placeholder*="e-mail" i]`,
];

const INJECTABLE_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map(
  (scope) => `${scope}:not([data-pp])`,
).join(', ');

const inputDelegate = delegate<HTMLInputElement>(INJECTABLE_EMAIL_INPUT_SCOPE);
const shadowInputDelegate = delegate<HTMLInputElement>(
  INJECTABLE_EMAIL_INPUT_SCOPE,
  { shadow: true },
);

async function handleHME(inputElement: HTMLInputElement) {
  inputElement.value = '';
  detectedInput = inputElement;
  const { email } = await getUserInfo();
  setInputValue(detectedInput, email);
}

async function injectDataList(inputElement: HTMLInputElement) {
  const datalistId = `pp-${window.crypto.randomUUID().substring(0, 8)}`;

  if (isFirefoxAndroid(navigator)) {
    const option = document.createElement('li');
    option.innerText = HME_LABEL;
    option.style.padding = '3px';
    option.style.cursor = 'pointer';

    const list = document.createElement('ul');
    list.id = datalistId;
    list.style.display = 'block';
    list.style.position = 'absolute';
    list.style.maxHeight = '300px';
    list.style.overflowY = 'auto';
    list.style.listStyle = 'none';
    list.style.background = 'white';
    list.style.boxShadow = '0 2px 2px #999';
    list.style.fontSize = 'small';
    list.style.zIndex = '1000';
    list.style.padding = list.style.margin = '0px';

    list.appendChild(option);

    document.body.appendChild(list);

    // add input element attribute to only apply once
    inputElement.setAttribute('data-pp', '');

    bindAbsolutePositionToViewPort(function () {
      const { left, width, bottom } = inputElement.getBoundingClientRect();
      list.style.top = bottom + 'px';
      list.style.left = left + 'px';
      list.style.width = width + 'px';
    });

    // handle show and hide
    bindVisibilityToInputFocus(inputElement, list);

    // handle selection
    option.addEventListener('click', async (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        list.style.visibility = 'hidden';
        await handleHME(inputElement);
      } catch (err) {
        displayError(err);
      }
    });
  } else {
    // create datalist option
    const option = document.createElement('option');
    option.setAttribute('id', 'new-privacy-addr');
    option.setAttribute('value', DATALIST_SUGGESTION);
    option.textContent = HME_LABEL;

    let datalist;

    // check if datalist exists
    if (inputElement.hasAttribute('list')) {
      const detectedDataListId = inputElement.getAttribute('list');
      if (detectedDataListId) {
        datalist = document.getElementById(detectedDataListId);
      }
    }

    if (!datalist) {
      // create datalist element
      datalist = document.createElement('datalist');
      datalist.setAttribute('id', datalistId);

      // add the datalist input element to the input
      inputElement.setAttribute('list', datalistId);
      inputElement.insertAdjacentElement('afterend', datalist);
    }

    // add option to datalist
    datalist.appendChild(option);

    // add input element attribute to only apply once
    inputElement.setAttribute('data-pp', '');

    // add logo btn to inputs on firefox
    if (isFirefox(navigator)) {
      const btn = document.createElement('button');
      btn.style.display = 'block';
      btn.style.position = 'absolute';
      btn.style.zIndex = '1000';
      btn.style.borderWidth = btn.style.padding = btn.style.margin = '0px';
      btn.style.borderRadius = '15px';
      btn.style.visibility = 'hidden';
      btn.title = HME_LABEL;

      bindAbsolutePositionToViewPort(function () {
        const { top, right, height } = inputElement.getBoundingClientRect();
        btn.style.width = btn.style.height = (height * 0.7).toFixed(2) + 'px';
        btn.style.top = (top + height * 0.15).toFixed(2) + 'px';
        btn.style.right =
          (window.innerWidth - right + height * 0.15).toFixed(2) + 'px';
      });

      btn.appendChild(hmeLogo());
      document.body.appendChild(btn);

      // handle show and hide
      bindVisibilityToInputFocus(inputElement, btn);

      btn.onclick = async () => {
        try {
          await handleHME(inputElement);
        } catch (err) {
          displayError(err);
        }
      };
    }
  }

  // listen to datalist selection (needs update in the future when datalist supports event listeners)
  inputElement.addEventListener('input', async () => {
    try {
      if (
        inputElement.value === '@' ||
        inputElement.value === DATALIST_SUGGESTION
      ) {
        await handleHME(inputElement);
      }
    } catch (err) {
      displayError(err);
    }
  });
}

export function detectAndInjectDataList() {
  for (const inputElement of Array.from(
    document.querySelectorAll<HTMLInputElement>(INJECTABLE_EMAIL_INPUT_SCOPE),
  )) {
    if (isElementDisplayed(inputElement)) {
      injectDataList(inputElement as HTMLInputElement).catch((e) => {
        console.error(e);
      });
    }
  }
}

function injectDataListOnFocus(containerElement: HTMLElement | Document) {
  if (containerElement?.addEventListener) {
    containerElement.addEventListener(
      'focusin',
      inputDelegate((inputElement: HTMLInputElement) => {
        injectDataList(inputElement);
      }),
      true,
    );
  }
}

function injectDataListOnShadowDom() {
  document.addEventListener(
    'click',
    shadowInputDelegate((inputElement) => {
      injectDataList(inputElement);
    }),
    true,
  );
}

function injectDataListOnFocusWithinIFrames() {
  // inject datalist when focused on input elements inside iframes
  [...Array.from(document.querySelectorAll('iframe'))].map((iframe) => {
    try {
      const iframeDocument =
        iframe?.contentDocument || iframe?.contentWindow?.document;
      // ensure iframe is accessible
      if (iframeDocument?.addEventListener) {
        injectDataListOnFocus(iframeDocument);
      }
    } catch {
      // do nothing
    }
  });
}

export function enableHideMyEmail() {
  window.addEventListener('load', () => {
    detectAndInjectDataList();
    injectDataListOnShadowDom();
    injectDataListOnFocusWithinIFrames();
  });

  if (document.readyState === 'complete') {
    detectAndInjectDataList();
    injectDataListOnShadowDom();
    injectDataListOnFocusWithinIFrames();
  }
}
