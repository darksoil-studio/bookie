import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';


import '@holochain-open-dev/file-storage/dist/elements/show-image.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { Resource } from '../types';

/**
 * @element resource-summary
 * @fires resource-selected: detail will contain { resourceHash }
 */
@localized()
@customElement('resource-summary')
export class ResourceSummary extends LitElement {

  // REQUIRED. The hash of the Resource to show
  @property(hashProperty('resource-hash'))
  resourceHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _resource = new StoreSubscriber(this, () => this.bookieStore.resources.get(this.resourceHash));

  renderSummary(entryRecord: EntryRecord<Resource>) {
    return html`
      <div style="display: flex; flex-direction: column">

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Name")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.name }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Description")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.description }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Image Hash")}:</strong></span>
 	    <span style="white-space: pre-line"><show-image .imageHash=${ entryRecord.entry.image_hash } style="width: 300px; height: 200px"></show-image></span>
	  </div>

      </div>
    `;
  }
  
  renderResource() {
    switch (this._resource.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._resource.value.value) return html`<span>${msg("The requested resource doesn't exist")}</span>`;

        return this.renderSummary(this._resource.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the resource")}
          .error=${this._resource.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('resource-selected', {
          composed: true,
          bubbles: true,
          detail: {
            resourceHash: this.resourceHash
          }
        }))}>
        ${this.renderResource()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
