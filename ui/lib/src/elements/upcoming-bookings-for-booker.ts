import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import './booking-summary.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';

/**
 * @element bookings-for-booker
 */
@localized()
@customElement('upcoming-bookings-for-booker')
export class UpcomingBookingsForBooker extends LitElement {
  // REQUIRED. The Booker for which the Bookings should be fetched
  @property(hashProperty('booker'))
  booker!: AgentPubKey;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _bookings = new StoreSubscriber(
    this,
    () => this.bookieStore.bookingsForBooker.get(this.booker),
    () => [this.booker]
  );

  firstUpdated() {
    if (this.booker === undefined) {
      throw new Error(
        `The booker property is required for the bookings-for-booker element`
      );
    }
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder">${msg('No bookings found.')}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          hash =>
            html`<booking-summary
              .bookingHash=${hash}
              style="margin-bottom: 16px;"
            ></booking-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._bookings.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        const bookings = this._bookings.value.value;
        const future = bookings
          .filter(b => b.entry.start_time >= Date.now() * 1000)
          .map(b => b.actionHash);

        return this.renderList(future);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the bookings')}
          .error=${this._bookings.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
