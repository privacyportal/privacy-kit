import {
  attachShadowDomToFirstCompatibleAncestor,
  bindShadowElementPosition,
  bindVisibilityToInputFocus,
  delegate,
  fmtPixelDimension,
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
    const { ancestor, shadowRoot } =
      await attachShadowDomToFirstCompatibleAncestor(inputElement);

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
    list.style.backgroundColor = 'Canvas';
    list.style.color = 'CanvasText';
    list.style.colorScheme = 'light dark';
    list.style.boxShadow = '0 2px 2px #999';
    list.style.fontSize = 'small';
    list.style.zIndex = '1000';
    list.style.opacity = '0';
    list.style.padding = list.style.margin = '0px';

    list.appendChild(option);

    const style = document.createElement('style');
    style.textContent = `li:hover{background-color:ButtonFace;color:ButtonText;}`;

    // Add list to shadow DOM
    shadowRoot.append(style, list);

    bindShadowElementPosition(inputElement, ancestor, () => {
      // update button position
      const inputRect = inputElement.getBoundingClientRect();
      const parentRect = ancestor.getBoundingClientRect();
      list.style.width = fmtPixelDimension(inputRect.width);
      list.style.top = fmtPixelDimension(inputRect.bottom - parentRect.top, {
        toFixed: 2,
      });
      list.style.left = fmtPixelDimension(inputRect.left - parentRect.left, {
        toFixed: 2,
      });
    });

    // add input element attribute to only apply once
    inputElement.setAttribute('data-pp', '');

    option.onmousedown = (e) => {
      // keep the focus on the input field
      e.preventDefault();
    };

    // handle selection
    option.onclick = async () => {
      list.style.opacity = '0';
      await handleHME(inputElement).catch(displayError);
    };

    // handle show and hide
    bindVisibilityToInputFocus(inputElement, list);
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
      const { ancestor, shadowRoot } =
        await attachShadowDomToFirstCompatibleAncestor(inputElement);

      // Create button element
      const btn = document.createElement('button');
      btn.title = HME_LABEL;
      btn.ariaLabel = HME_LABEL;

      Object.assign(btn.style, {
        position: 'absolute',
        border: 'none',
        borderRadius: '15px',
        cursor: 'pointer',
        padding: '0',
        margin: '0',
        zIndex: '1000',
        pointerEvents: 'auto',
        right: '8px',
        opacity: '0',
      });

      btn.appendChild(hmeLogo());

      // Add elements to shadow DOM
      shadowRoot.append(btn);

      bindShadowElementPosition(inputElement, ancestor, () => {
        // update button position
        const rect = inputElement.getBoundingClientRect();
        const parentRect = ancestor.getBoundingClientRect();
        const paddingRight =
          parseFloat(
            window
              .getComputedStyle(inputElement)
              .getPropertyValue('padding-right'),
          ) || 0;
        btn.style.height = btn.style.width = fmtPixelDimension(
          rect.height * 0.7,
          { toFixed: 2 },
        );
        btn.style.top = fmtPixelDimension(
          rect.top - parentRect.top + rect.height * 0.15,
          { toFixed: 2 },
        );
        btn.style.right = fmtPixelDimension(
          parentRect.right -
            rect.right +
            Math.max(paddingRight, rect.height * 0.15),
          { toFixed: 2 },
        );
      });

      btn.onmousedown = (e) => {
        // keep the focus on the input field
        e.preventDefault();
      };

      btn.onclick = async () => {
        try {
          btn.disabled = true;
          await handleHME(inputElement);
        } catch (err) {
          displayError(err);
        } finally {
          btn.disabled = false;
        }
      };

      // handle show and hide
      bindVisibilityToInputFocus(inputElement, btn);
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
      injectDataList(inputElement as HTMLInputElement).catch(console.error);
    }
  }
}

function injectDataListOnFocus(containerElement: HTMLElement | Document) {
  if (containerElement?.addEventListener) {
    containerElement.addEventListener(
      'focusin',
      inputDelegate((inputElement: HTMLInputElement) => {
        injectDataList(inputElement).catch(console.error);
      }),
      true,
    );
  }
}

function injectDataListOnShadowDom() {
  document.addEventListener(
    'click',
    shadowInputDelegate((inputElement) => {
      injectDataList(inputElement).catch(console.error);
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
