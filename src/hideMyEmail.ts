import { delegate, isElementDisplayed, setInputValue } from './lib/domUtils.js';
import { displayError } from './lib/errors.js';
import { getUserInfo } from './lib/mailRelay.js';

let detectedInput: HTMLInputElement;

const DATALIST_SUGGESTION = '*****@pportal.io';

export const TEXT_INPUT_SCOPE = 'input[type=text]';
export const EMAIL_INPUT_SCOPES = [
  `input[type=email]`,
  `${TEXT_INPUT_SCOPE}[id*=email]`,
  `${TEXT_INPUT_SCOPE}[name*=email]`,
  `${TEXT_INPUT_SCOPE}[name*=username]`,
  `${TEXT_INPUT_SCOPE}[name*=login]`,
  `${TEXT_INPUT_SCOPE}[placeholder*=email]`,
];

const INJECTABLE_EMAIL_INPUT_SCOPE = EMAIL_INPUT_SCOPES.map(
  (scope) => `${scope}:not([data-pp])`,
).join(', ');

const isFirefoxAndroid = function (navigator: Navigator): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('firefox') > -1 && ua.indexOf('android') > -1;
};

const inputDelegate = delegate<HTMLInputElement>(INJECTABLE_EMAIL_INPUT_SCOPE);

async function injectDataList(inputElement: HTMLInputElement) {
  const datalistId = `pp-${window.crypto.randomUUID().substring(0, 8)}`;

  if (isFirefoxAndroid(navigator)) {
    const option = document.createElement('li');
    option.innerText = 'Hide my Email';
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
    list.style.padding = '0px';
    list.style.margin = '0px';

    list.appendChild(option);

    const positionList = function () {
      const { left, width, bottom } = inputElement.getBoundingClientRect();
      list.style.top = bottom + 'px';
      list.style.left = left + 'px';
      list.style.width = width + 'px';
    };

    document.body.appendChild(list);

    // add input element attribute to only apply once
    inputElement.setAttribute('data-pp', '');

    // position the list
    positionList();
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', positionList);
    } else {
      (window as Window).addEventListener('resize', positionList);
    }

    // handle show and hide
    inputElement.addEventListener('focusin', () => {
      list.style.visibility = 'visible';
    });
    inputElement.addEventListener('focusout', () => {
      // delay to ensure click event is triggered
      setTimeout(() => {
        list.style.visibility = 'hidden';
      }, 0);
    });

    // handle focusout using click event to ensure lists have precedence
    document.addEventListener(
      'click',
      (e) => {
        if (list.style.visibility === 'visible') {
          const rect = inputElement.getBoundingClientRect();
          if (
            e.clientY < rect.top ||
            e.clientY > rect.bottom ||
            e.clientX < rect.left ||
            e.clientX > rect.right
          ) {
            list.style.visibility = 'hidden';
          }
        }
      },
      true,
    );

    // handle selection
    option.addEventListener('click', async (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        inputElement.value = '';
        detectedInput = inputElement;
        list.style.visibility = 'hidden';
        const { email } = await getUserInfo();
        setInputValue(detectedInput, email);
      } catch (err) {
        displayError(err);
      }
    });
  } else {
    // create datalist option
    const option = document.createElement('option');
    option.setAttribute('id', 'new-privacy-addr');
    option.setAttribute('value', DATALIST_SUGGESTION);
    option.textContent = 'Hide my Email';

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
  }

  // listen to datalist selection (needs update in the future when datalist supports event listeners)
  inputElement.addEventListener('input', async () => {
    try {
      if (
        inputElement.value === '@' ||
        inputElement.value === DATALIST_SUGGESTION
      ) {
        inputElement.value = '';
        detectedInput = inputElement;
        const { email } = await getUserInfo();
        setInputValue(detectedInput, email);
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
    injectDataListOnFocusWithinIFrames();
  });

  if (document.readyState === 'complete') {
    detectAndInjectDataList();
    injectDataListOnFocusWithinIFrames();
  }
}
