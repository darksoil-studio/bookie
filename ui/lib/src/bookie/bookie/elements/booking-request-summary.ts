import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { BookingRequest } from '../types';

/**
 * @element booking-request-summary
 * @fires booking-request-selected: detail will contain { bookingRequestHash }
 */
@localized()
@customElement('booking-request-summary')
export class BookingRequestSummary extends LitElement {

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

  renderSummary(entryRecord: EntryRecord<BookingRequest>) {
    return html`
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
    `;
  }
  
  renderBookingRequest() {
    switch (this._bookingRequest.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._bookingRequest.value.value) return html`<span>${msg("The requested booking request doesn't exist")}</span>`;

        return this.renderSummary(this._bookingRequest.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the booking request")}
          .error=${this._bookingRequest.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('booking-request-selected', {
          composed: true,
          bubbles: true,
          detail: {
            bookingRequestHash: this.bookingRequestHash
          }
        }))}>
        ${this.renderBookingRequest()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
