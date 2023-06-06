import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { hashProperty, sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import './booking-request-summary.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';

/**
 * @element my-booking-requests
 */
@localized()
@customElement('my-booking-requests')
export class MyBookingRequests extends LitElement {

  // REQUIRED. The author for which the BookingRequests should be fetched
  @property(hashProperty('author'))
  author!: AgentPubKey;
  
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _myBookingRequests = new StoreSubscriber(this, 
    () => this.bookieStore.myBookingRequests.get(this.author),
    () => [this.author]
  );

  firstUpdated() {
    if (this.author === undefined) {
      throw new Error(`The author property is required for the MyBookingRequests element`);
    }
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          ></sl-icon
        >
        <span class="placeholder">${msg("No booking requests found")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column; flex: 1">
        ${hashes.map(hash => 
          html`<booking-request-summary .bookingRequestHash=${hash} style="margin-bottom: 16px;"></booking-request-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._myBookingRequests.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        return this.renderList(this._myBookingRequests.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the booking requests")}
          .error=${this._myBookingRequests.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
