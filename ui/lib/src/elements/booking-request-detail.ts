import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  asyncDeriveAndJoin,
  completed,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import {
  sharedStyles,
  hashProperty,
  wrapPathInSvg,
  notifyError,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import './edit-booking-request.js';

import { BookieStore, RequestStatus } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { BookingRequest, Resource } from '../types.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';

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
  _bookingRequest = new StoreSubscriber(
    this,
    () =>
      asyncDeriveAndJoin(
        this.bookieStore.bookingRequests.get(this.bookingRequestHash),
        bookingRequest =>
          bookingRequest
            ? this.bookieStore.resources.get(
                bookingRequest.bookingRequest.entry.resource_hash
              )
            : completed(undefined)
      ),
    () => [this.bookingRequestHash]
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  /**
   * @internal
   */
  @state()
  cancelling = false;

  /**
   * @internal
   */
  @state()
  creatingBooking = false;

  /**
   * @internal
   */
  @state()
  rejecting = false;

  async cancelBookingRequest() {
    if (this.cancelling) return;
    this.cancelling = true;
    try {
      await this.bookieStore.client.cancelBookingRequest(
        this.bookingRequestHash
      );

      this.dispatchEvent(
        new CustomEvent('booking-request-cancelled', {
          bubbles: true,
          composed: true,
          detail: {
            bookingRequestHash: this.bookingRequestHash,
          },
        })
      );
      (this.shadowRoot?.querySelector('sl-dialog') as SlDialog).hide();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error cancelling the booking request'));
    }
    this.cancelling = false;
  }

  async rejectBookingRequest() {
    if (this.rejecting) return;
    this.rejecting = true;
    try {
      await this.bookieStore.client.rejectBookingRequest(
        this.bookingRequestHash
      );

      this.dispatchEvent(
        new CustomEvent('booking-request-rejected', {
          bubbles: true,
          composed: true,
          detail: {
            bookingRequestHash: this.bookingRequestHash,
          },
        })
      );
      (this.shadowRoot?.querySelector('sl-dialog') as SlDialog).hide();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error rejecting the booking request'));
    }
    this.rejecting = false;
  }

  async createBooking(bookingRequest: EntryRecord<BookingRequest>) {
    if (this.creatingBooking) return;
    this.creatingBooking = true;
    try {
      const booking = await this.bookieStore.client.createBooking({
        booking_request_hash: bookingRequest.actionHash,
        end_time: bookingRequest.entry.end_time,
        start_time: bookingRequest.entry.start_time,
        title: bookingRequest.entry.title,
        resource_hash: bookingRequest.entry.resource_hash,
      });

      this.dispatchEvent(
        new CustomEvent('booking-created', {
          bubbles: true,
          composed: true,
          detail: {
            bookingHash: booking.actionHash,
          },
        })
      );
      (this.shadowRoot?.querySelector('sl-dialog') as SlDialog).hide();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error acceptin the booking request'));
    }
    this.creatingBooking = false;
  }

  renderDetail(
    bookingRequest: EntryRecord<BookingRequest>,
    status: RequestStatus,
    resource: EntryRecord<Resource>
  ) {
    return html`
      ${false &&
      bookingRequest.action.author.toString() ===
        this.bookieStore.client.client.myPubKey.toString()
        ? html`
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
              .loading=${this.cancelling}
              @click=${() => this.cancelBookingRequest()}
            ></sl-icon-button>
          `
        : html``}

      <div style="display: flex; flex-direction: column">
        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Title')}:</strong></span
          >
          <span style="white-space: pre-line"
            >${bookingRequest.entry.title}</span
          >
        </div>

        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Comment')}:</strong></span
          >
          <span style="white-space: pre-line"
            >${bookingRequest.entry.comment}</span
          >
        </div>
      </div>

      <div style="display: flex; flex-direction: column; margin-bottom: 16px">
        <span style="margin-bottom: 8px"
          ><strong>${msg('Time Slot')}:</strong></span
        >
        <div class="row">
          <span>${msg('From')}&nbsp;</span>
          <sl-format-date
            month="long"
            day="numeric"
            year="numeric"
            hour="numeric"
            minute="numeric"
            .date=${new Date(bookingRequest.entry.start_time / 1000)}
          ></sl-format-date>
          <span>&nbsp;${msg('to')}&nbsp;</span>
          <sl-format-date
            month="long"
            day="numeric"
            year="numeric"
            hour="numeric"
            minute="numeric"
            .date=${new Date(bookingRequest.entry.end_time / 1000)}
          ></sl-format-date>
        </div>
      </div>

      <div slot="footer" class="row">
        <span style="flex: 1"></span>
        ${bookingRequest.action.author.toString() ===
          this.bookieStore.client.client.myPubKey.toString() &&
        status.status === 'pending'
          ? html`
              <sl-button
                variant="warning"
                .loading=${this.cancelling}
                @click=${() => this.cancelBookingRequest()}
                >${msg('Cancel')}</sl-button
              >
            `
          : html``}
        ${resource.action.author.toString() ===
          this.bookieStore.client.client.myPubKey.toString() &&
        status.status === 'pending'
          ? html`
              <sl-button
                variant="danger"
                style="margin-left: 16px"
                .loading=${this.rejecting}
                @click=${() => this.rejectBookingRequest()}
                >${msg('Reject')}</sl-button
              >
              <sl-button
                variant="success"
                style="margin-left: 16px"
                .loading=${this.creatingBooking}
                @click=${() => this.createBooking(bookingRequest)}
                >${msg('Accept')}</sl-button
              >
            `
          : html``}
      </div>
    `;
  }

  renderContent() {
    console.log(this._bookingRequest.value);
    switch (this._bookingRequest.value.status) {
      case 'pending':
        return html`
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        `;
      case 'complete':
        const bookingRequest = this._bookingRequest.value.value;

        if (!bookingRequest[0])
          return html`<span
            >${msg("The requested booking request doesn't exist")}</span
          >`;

        if (this._editing) {
          return html`<edit-booking-request
            .currentRecord=${bookingRequest}
            @booking-request-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
            style="display: flex; flex: 1;"
          ></edit-booking-request>`;
        }

        return this.renderDetail(
          bookingRequest[0].bookingRequest,
          bookingRequest[0].status,
          bookingRequest[1]!
        );
      case 'error':
        return html`
          <display-error
            .headline=${msg('Error fetching the booking request')}
            .error=${this._bookingRequest.value.error.data.data}
          ></display-error>
        `;
    }
  }
  render() {
    return html`
      <sl-dialog
        .label=${msg('Booking Request')}
        open
        @sl-request-close=${(e: Event) => {
          if (this.cancelling || this.rejecting || this.creatingBooking) {
            e.preventDefault();
          }
        }}
        >${this.renderContent()}
      </sl-dialog>
    `;
  }

  static styles = [sharedStyles];
}
