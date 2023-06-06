import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, hashProperty, wrapPathInSvg, notifyError } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import '@holochain-open-dev/file-storage/dist/elements/show-image.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import './edit-resource.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Resource } from '../types.js';

/**
 * @element resource-detail
 * @fires resource-deleted: detail will contain { resourceHash }
 */
@localized()
@customElement('resource-detail')
export class ResourceDetail extends LitElement {

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

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteResource() {
    try {
      await this.bookieStore.client.deleteResource(this.resourceHash);
 
      this.dispatchEvent(new CustomEvent('resource-deleted', {
        bubbles: true,
        composed: true,
        detail: {
          resourceHash: this.resourceHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error deleting the resource"));
    }
  }

  renderDetail(entryRecord: EntryRecord<Resource>) {
    return html`
      <sl-card>
      	<div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg("Resource")}</span>

          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiPencil)} @click=${() => { this._editing = true; } }></sl-icon-button>
          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteResource()}></sl-icon-button>
        </div>

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
      </sl-card>
    `;
  }
  
  render() {
    switch (this._resource.value.status) {
      case "pending":
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case "complete":
        const resource = this._resource.value.value;
        
        if (!resource) return html`<span>${msg("The requested resource doesn't exist")}</span>`;
    
        if (this._editing) {
    	  return html`<edit-resource
    	    .originalResourceHash=${this.resourceHash}
    	    .currentRecord=${ resource }
            @resource-updated=${async () => { this._editing = false; } }
      	    @edit-canceled=${() => { this._editing = false; } }
    	    style="display: flex; flex: 1;"
    	  ></edit-resource>`;
      }

        return this.renderDetail(resource);
      case "error":
        return html`<sl-card>
          <display-error
            .headline=${msg("Error fetching the resource")}
            .error=${this._resource.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }
  
  static styles = [sharedStyles];
}
