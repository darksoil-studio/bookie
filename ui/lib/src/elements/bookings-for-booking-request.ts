
import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { Record, EntryHash, ActionHash, AgentPubKey } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';
import { hashProperty, sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking } from '../types.js';

import './booking-summary.js';

/**
 * @element bookings-for-booking-request
 */
@localized()
@customElement('bookings-for-booking-request')
export class BookingsForBookingRequest extends LitElement {

  // REQUIRED. The BookingRequestHash for which the Bookings should be fetched
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
  _bookings = new StoreSubscriber(this, () =>
    this.bookieStore.bookingsForBookingRequest.get(this.bookingRequestHash)
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder">${msg("No bookings found for this booking request")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(hash =>
          html`<booking-summary .bookingHash=${hash}></booking-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._bookings.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete": 
        return this.renderList(this._bookings.value.value);
      case "error":
        return html`<display-error 
          .headline=${msg("Error fetching the bookings")}
          .error=${this._bookings.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
