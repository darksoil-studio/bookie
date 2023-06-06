import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { Booking } from '../types';

/**
 * @element booking-summary
 * @fires booking-selected: detail will contain { bookingHash }
 */
@localized()
@customElement('booking-summary')
export class BookingSummary extends LitElement {

  // REQUIRED. The hash of the Booking to show
  @property(hashProperty('booking-hash'))
  bookingHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _booking = new StoreSubscriber(this, () => this.bookieStore.bookings.get(this.bookingHash));

  renderSummary(entryRecord: EntryRecord<Booking>) {
    return html`
      <div style="display: flex; flex-direction: column">

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Title")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.title }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Start Time")}:</strong></span>
 	    <span style="white-space: pre-line"><sl-format-date .date=${new Date(entryRecord.entry.start_time / 1000) }></sl-format-date></span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("End Time")}:</strong></span>
 	    <span style="white-space: pre-line"><sl-format-date .date=${new Date(entryRecord.entry.end_time / 1000) }></sl-format-date></span>
	  </div>

      </div>
    `;
  }
  
  renderBooking() {
    switch (this._booking.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._booking.value.value) return html`<span>${msg("The requested booking doesn't exist")}</span>`;

        return this.renderSummary(this._booking.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the booking")}
          .error=${this._booking.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('booking-selected', {
          composed: true,
          bubbles: true,
          detail: {
            bookingHash: this.bookingHash
          }
        }))}>
        ${this.renderBooking()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
