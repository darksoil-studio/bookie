import { LitElement, html } from 'lit';
import { repeat } from "lit/directives/repeat.js";
import { state, customElement, property } from 'lit/decorators.js';
import { ActionHash, Record, EntryHash, AgentPubKey } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashState, notifyError, sharedStyles, hashProperty, wrapPathInSvg, onSubmit } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@holochain-open-dev/file-storage/dist/elements/upload-files.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { Resource } from '../types';

/**
 * @element edit-resource
 * @fires resource-updated: detail will contain { originalResourceHash, previousResourceHash, updatedResourceHash }
 */
@localized()
@customElement('edit-resource')
export class EditResource extends LitElement {

  // REQUIRED. The hash of the original `Create` action for this Resource
  @property(hashProperty('original-resource-hash'))
  originalResourceHash!: ActionHash;
  
  // REQUIRED. The current Resource record that should be updated
  @property()
  currentRecord!: EntryRecord<Resource>;
  
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  @state()
  committing = false;
   

  firstUpdated() {
    this.shadowRoot?.querySelector('form')!.reset();
  }

  async updateResource(fields: any) {  
    const resource: Resource = { 
      name: fields.name,
      description: fields.description,
      image_hash: fields.image_hash,
    };

    try {
      this.committing = true;
      const updateRecord = await this.bookieStore.client.updateResource(
        this.originalResourceHash,
        this.currentRecord.actionHash,
        resource
      );
  
      this.dispatchEvent(new CustomEvent('resource-updated', {
        composed: true,
        bubbles: true,
        detail: {
          originalResourceHash: this.originalResourceHash,
          previousResourceHash: this.currentRecord.actionHash,
          updatedResourceHash: updateRecord.actionHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error updating the resource"));
    }
    
    this.committing = false;
  }

  render() {
    return html`
      <sl-card>
        <span slot="header">${msg("Edit Resource")}</span>

        <form 
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.updateResource(fields))}
        >  
          <div style="margin-bottom: 16px">
        <sl-input name="name" .label=${msg("Name")}  required .defaultValue=${ this.currentRecord.entry.name }></sl-input>          </div>

          <div style="margin-bottom: 16px">
        <sl-textarea name="description" .label=${msg("Description")}  required .defaultValue=${ this.currentRecord.entry.description }></sl-textarea>          </div>

          <div style="margin-bottom: 16px">
        <upload-files name="image_hash" one-file accepted-files="image/jpeg,image/png,image/gif" required .defaultValue=${ this.currentRecord.entry.image_hash }></upload-files>          </div>



          <div style="display: flex; flex-direction: row">
            <sl-button
              @click=${() => this.dispatchEvent(new CustomEvent('edit-canceled', {
                bubbles: true,
                composed: true
              }))}
              style="flex: 1;"
            >${msg("Cancel")}</sl-button>
            <sl-button
              type="submit"
              variant="primary"
              style="flex: 1;"
              .loading=${this.committing}
            >${msg("Save")}</sl-button>

          </div>
        </form>
      </sl-card>`;
  }

  static styles = [sharedStyles];
}
