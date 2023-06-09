import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { localized, msg } from '@lit/localize';
import { sharedStyles } from '@holochain-open-dev/elements';

import '@darksoil/bookie/dist/elements/main-dashboard.js';

@localized()
@customElement('applet-main')
export class AppletMain extends LitElement {
  render() {
    return html` <main-dashboard></main-dashboard> `;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex: 1;
      }
    `,
    sharedStyles,
  ];
}
