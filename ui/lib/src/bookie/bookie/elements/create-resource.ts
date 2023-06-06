import { LitElement, html } from 'lit';
import { repeat } from "lit/directives/repeat.js";
import { state, property, query, customElement } from 'lit/decorators.js';
import { ActionHash, Record, DnaHash, AgentPubKey, EntryHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashProperty, notifyError, hashState, sharedStyles, onSubmit, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import '@holochain-open-dev/file-storage/dist/elements/upload-files.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Resource } from '../types.js';

/**
 * @element create-resource
 * @fires resource-created: detail will contain { resourceHash }
 */
@localized()
@customElement('create-resource')
export class CreateResource extends LitElement {

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;


  async createResource(fields: any) {
    if (this.committing) return;
  
  
    const resource: Resource = {
      name: fields.name,
      description: fields.description,
      image_hash: fields.image_hash,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Resource> = await this.bookieStore.client.createResource(resource);

      this.dispatchEvent(new CustomEvent('resource-created', {
        composed: true,
        bubbles: true,
        detail: {
          resourceHash: record.actionHash
        }
      }));
      
      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the resource"));
    }
    this.committing = false;
  }

  render() {
    return html`
      <sl-card style="flex: 1;">
        <span slot="header">${msg("Create Resource")}</span>

        <form 
          id="create-form"
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.createResource(fields))}
        >  
          <div style="margin-bottom: 16px;">
          <sl-input name="name" .label=${msg("Name")}  required></sl-input>          </div>

          <div style="margin-bottom: 16px;">
          <sl-textarea name="description" .label=${msg("Description")}  required></sl-textarea>          </div>

          <div style="margin-bottom: 16px;">
          <upload-files name="image_hash" one-file accepted-files="image/jpeg,image/png,image/gif" required></upload-files>          </div>


          <sl-button
            variant="primary"
            type="submit"
            .loading=${this.committing}
          >${msg("Create Resource")}</sl-button>
        </form> 
      </sl-card>`;
  }
  
  static styles = [sharedStyles];
}
