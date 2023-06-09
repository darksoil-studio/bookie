import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  asyncDeriveAndJoin,
  completed,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { Booking, Resource } from '../types';

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
  _booking = new StoreSubscriber(
    this,
    () =>
      asyncDeriveAndJoin(
        this.bookieStore.bookings.get(this.bookingHash),
        booking =>
          booking
            ? this.bookieStore.resources.get(booking.entry.resource_hash)
            : completed(undefined)
      ),
    () => [this.bookingHash]
  );

  renderSummary(
    booking: EntryRecord<Booking>,
    resource: EntryRecord<Resource>
  ) {
    return html`
      <div style="display: flex; flex-direction: column">
        <span class="title" style="white-space: pre-line; margin-bottom: 16px"
          >${booking.entry.title}</span
        >

        <span style="margin-bottom: 16px"
          >${msg('In')}&nbsp;${resource.entry.name}</span
        >

        <div class="row">
          <span>${msg('From')}&nbsp;</span>
          <sl-format-date
            month="long"
            day="numeric"
            year="numeric"
            hour="numeric"
            minute="numeric"
            .date=${new Date(booking.entry.start_time / 1000)}
          ></sl-format-date>
          <span>&nbsp;${msg('to')}&nbsp;</span>
          <sl-format-date
            month="long"
            day="numeric"
            year="numeric"
            hour="numeric"
            minute="numeric"
            .date=${new Date(booking.entry.end_time / 1000)}
          ></sl-format-date>
        </div>
      </div>
    `;
  }

  renderBooking() {
    switch (this._booking.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._booking.value.value)
          return html`<span
            >${msg("The requested booking doesn't exist.")}</span
          >`;

        return this.renderSummary(
          this._booking.value.value[0]!,
          this._booking.value.value[1]!
        );
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the booking')}
          .error=${this._booking.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('booking-selected', {
            composed: true,
            bubbles: true,
            detail: {
              bookingHash: this.bookingHash,
            },
          })
        )}
    >
      ${this.renderBooking()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
