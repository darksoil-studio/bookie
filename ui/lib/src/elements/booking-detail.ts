import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import {
  sharedStyles,
  hashProperty,
  wrapPathInSvg,
  notifyError,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import './edit-booking.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking } from '../types.js';

/**
 * @element booking-detail
 * @fires booking-deleted: detail will contain { bookingHash }
 */
@localized()
@customElement('booking-detail')
export class BookingDetail extends LitElement {
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
  _booking = new StoreSubscriber(this, () =>
    this.bookieStore.bookings.get(this.bookingHash)
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteBooking() {
    try {
      await this.bookieStore.client.deleteBooking(this.bookingHash);

      this.dispatchEvent(
        new CustomEvent('booking-deleted', {
          bubbles: true,
          composed: true,
          detail: {
            bookingHash: this.bookingHash,
          },
        })
      );
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error deleting the booking'));
    }
  }

  renderDetail(entryRecord: EntryRecord<Booking>) {
    return html`
      <sl-card>
        <div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg('Booking')}</span>

          <sl-icon-button
            style="margin-left: 8px"
            .src=${wrapPathInSvg(mdiPencil)}
            @click=${() => {
              this._editing = true;
            }}
          ></sl-icon-button>
          <sl-icon-button
            style="margin-left: 8px"
            .src=${wrapPathInSvg(mdiDelete)}
            @click=${() => this.deleteBooking()}
          ></sl-icon-button>
        </div>

        <div style="display: flex; flex-direction: column">
          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('Title')}:</strong></span
            >
            <span style="white-space: pre-line"
              >${entryRecord.entry.title}</span
            >
          </div>

          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('Start Time')}:</strong></span
            >
            <span style="white-space: pre-line"
              ><sl-format-date
                .date=${new Date(entryRecord.entry.start_time / 1000)}
              ></sl-format-date
            ></span>
          </div>

          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('End Time')}:</strong></span
            >
            <span style="white-space: pre-line"
              ><sl-format-date
                .date=${new Date(entryRecord.entry.end_time / 1000)}
              ></sl-format-date
            ></span>
          </div>
        </div>
      </sl-card>
    `;
  }

  render() {
    switch (this._booking.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const booking = this._booking.value.value;

        if (!booking)
          return html`<span
            >${msg("The requested booking doesn't exist")}</span
          >`;

        if (this._editing) {
          return html`<edit-booking
            .currentRecord=${booking}
            @booking-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
            style="display: flex; flex: 1;"
          ></edit-booking>`;
        }

        return this.renderDetail(booking);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the booking')}
            .error=${this._booking.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
