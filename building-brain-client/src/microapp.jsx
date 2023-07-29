

import React from 'react'
import { createRoot } from 'react-dom/client';
import App from './App'
const APP_ROOT_ELEMENT = (CONSTANTS.SINGLE_SPA_ENABLED === 'single-spa') ? `unnamed-microapp-root` : `building-brain-root`;

const MFE_APP_ROOT_ELEMENT = `building-brain-mfe-content-root`;

/* eslint-disable no-undef, react/jsx-filename-extension */
// Note: we're disabling this rule, becuase we know document exists in the browser
// and we're using it to create and insert elements.
// we're also using JSX here, so we're disabling the filename extension rule
const render = (props) => {
  const appID = props?.appId ?? null;
  const container = document.getElementById(appID || APP_ROOT_ELEMENT);
  const root = createRoot(container);

  if (props != null && props.microAppWrapper != null) {
    const MicroAppWrapper = props.microAppWrapper;
    root.render(
      <React.StrictMode>
        <MicroAppWrapper>
          <App />
        </MicroAppWrapper>
      </React.StrictMode>);
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>);
  }
};


if (CONSTANTS.SINGLE_SPA_ENABLED !== 'single-spa') {
  render();
}

let intervalId = null;
export function bootstrap(props) {
  return new Promise((resolve, reject) => {
    try {
      intervalId = setInterval(() => {
        // NOTE: this will be replaced with a less brittle event based solution soon
        let microappRoot = document.getElementById(props.appId || APP_ROOT_ELEMENT);

        if (microappRoot == null) {
          microappRoot = document.createElement("div");
          microappRoot.id = props.appId || APP_ROOT_ELEMENT;
          document.getElementById(MFE_APP_ROOT_ELEMENT).appendChild(microappRoot);
        }

        if (microappRoot != null) {
          microappRoot.style.position = "static";
          microappRoot.style.top = null;
        }

        clearInterval(intervalId);
        resolve()
      }, 500);
      // react app bootstraped
    } catch (e) {
      reject(e);
    }
  })
}
// note that these functions will only be called in the single-spa lifecycles / boostrapping.
// they will not run when running stand alone
export async function mount(props) {
  render(props);
}

export async function unmount(props) {
  const microappRoot = document.getElementById(props.appId || APP_ROOT_ELEMENT)

  if (microappRoot != null) {
    microappRoot.style.position = "absolute";
    microappRoot.style.top = -2000;
  }
}
