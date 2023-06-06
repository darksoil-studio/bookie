import { LitElement, html } from 'lit';
import { repeat } from "lit/directives/repeat.js";
import { state, customElement, property } from 'lit/decorators.js';
import { ActionHash, Record, EntryHash, AgentPubKey } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashState, notifyError, sharedStyles, hashProperty, wrapPathInSvg, onSubmit } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { BookingRequest } from '../types';

/**
 * @element edit-booking-request
 * @fires booking-request-updated: detail will contain { previousBookingRequestHash, updatedBookingRequestHash }
 */
@localized()
@customElement('edit-booking-request')
export class EditBookingRequest extends LitElement {

  
  // REQUIRED. The current BookingRequest record that should be updated
  @property()
  currentRecord!: EntryRecord<BookingRequest>;
  
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

  async updateBookingRequest(fields: any) {  
    const bookingRequest: BookingRequest = { 
      resource_hash: this.currentRecord.entry.resource_hash,
      title: fields.title,
      comment: fields.comment,
      start_time: this.currentRecord.entry.start_time,
      end_time: this.currentRecord.entry.end_time,
    };

    try {
      this.committing = true;
      const updateRecord = await this.bookieStore.client.updateBookingRequest(
        this.currentRecord.actionHash,
        bookingRequest
      );
  
      this.dispatchEvent(new CustomEvent('booking-request-updated', {
        composed: true,
        bubbles: true,
        detail: {
          previousBookingRequestHash: this.currentRecord.actionHash,
          updatedBookingRequestHash: updateRecord.actionHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error updating the booking request"));
    }
    
    this.committing = false;
  }

  render() {
    return html`
      <sl-card>
        <span slot="header">${msg("Edit Booking Request")}</span>

        <form 
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.updateBookingRequest(fields))}
        >  
          <div style="margin-bottom: 16px">
        <sl-input name="title" .label=${msg("Title")}  required .defaultValue=${ this.currentRecord.entry.title }></sl-input>          </div>

          <div style="margin-bottom: 16px">
        <sl-textarea name="comment" .label=${msg("Comment")}  required .defaultValue=${ this.currentRecord.entry.comment }></sl-textarea>          </div>



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
