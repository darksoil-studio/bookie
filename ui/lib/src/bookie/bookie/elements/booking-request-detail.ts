import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, hashProperty, wrapPathInSvg, notifyError } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import './edit-booking-request.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { BookingRequest } from '../types.js';

/**
 * @element booking-request-detail
 * @fires booking-request-deleted: detail will contain { bookingRequestHash }
 */
@localized()
@customElement('booking-request-detail')
export class BookingRequestDetail extends LitElement {

  // REQUIRED. The hash of the BookingRequest to show
  @property(hashProperty('booking-request-hash'))
  bookingRequestHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
   _bookingRequest = new StoreSubscriber(this, () => this.bookieStore.bookingRequests.get(this.bookingRequestHash));

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteBookingRequest() {
    try {
      await this.bookieStore.client.deleteBookingRequest(this.bookingRequestHash);
 
      this.dispatchEvent(new CustomEvent('booking-request-deleted', {
        bubbles: true,
        composed: true,
        detail: {
          bookingRequestHash: this.bookingRequestHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error deleting the booking request"));
    }
  }

  renderDetail(entryRecord: EntryRecord<BookingRequest>) {
    return html`
      <sl-card>
      	<div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg("Booking Request")}</span>

          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiPencil)} @click=${() => { this._editing = true; } }></sl-icon-button>
          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteBookingRequest()}></sl-icon-button>
        </div>

        <div style="display: flex; flex-direction: column">
  
          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Title")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.title }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Comment")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.comment }</span>
	  </div>

      </div>
      </sl-card>
    `;
  }
  
  render() {
    switch (this._bookingRequest.value.status) {
      case "pending":
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case "complete":
        const bookingRequest = this._bookingRequest.value.value;
        
        if (!bookingRequest) return html`<span>${msg("The requested booking request doesn't exist")}</span>`;
    
        if (this._editing) {
    	  return html`<edit-booking-request
    	    .currentRecord=${ bookingRequest }
            @booking-request-updated=${async () => { this._editing = false; } }
      	    @edit-canceled=${() => { this._editing = false; } }
    	    style="display: flex; flex: 1;"
    	  ></edit-booking-request>`;
      }

        return this.renderDetail(bookingRequest);
      case "error":
        return html`<sl-card>
          <display-error
            .headline=${msg("Error fetching the booking request")}
            .error=${this._bookingRequest.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }
  
  static styles = [sharedStyles];
}
