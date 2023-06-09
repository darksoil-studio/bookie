import { css, html, LitElement } from 'lit';
import { ContextProvider, provide } from '@lit-labs/context';
import { customElement, property } from 'lit/decorators.js';

import { bookieStoreContext } from '../context.js';
import { BookieStore } from '../bookie-store.js';

@customElement('bookie-context')
export class BookieContext extends LitElement {
  @provide({ context: bookieStoreContext })
  @property({ type: Object })
  store!: BookieStore;

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
