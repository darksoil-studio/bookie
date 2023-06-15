import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import './resource-summary.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';

/**
 * @element all-resources
 */
@localized()
@customElement('all-resources')
export class AllResources extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _allResources = new StoreSubscriber(
    this,
    () => this.bookieStore.allResources,
    () => []
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content" style="margin: 16px">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
        ></sl-icon>
        <span class="placeholder">${msg('No resources found.')}</span>
      </div>`;

    return html`
      <div
        style="display: flex; flex-direction: row; flex-wrap: wrap; margin: 16px"
      >
        ${hashes.map(
          hash =>
            html`<resource-summary
              .resourceHash=${hash}
              style="margin-right: 16px;"
            ></resource-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._allResources.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._allResources.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the resources')}
          .error=${this._allResources.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
