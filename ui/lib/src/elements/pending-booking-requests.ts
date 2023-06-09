import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

import './booking-request-summary.js';
import './booking-request-detail.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { BookingRequest } from '../types.js';
import { EntryRecord } from '@holochain-open-dev/utils';

/**
 * @element my-booking-requests
 */
@localized()
@customElement('pending-booking-requests')
export class PendingBookingRequests extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  pendingBookingRequests = new StoreSubscriber(
    this,
    () => this.bookieStore.pendingBookingRequests,
    () => []
  );

  @state()
  selectedBookingRequest: ActionHash | undefined;

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content" style="flex: 1">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
        ></sl-icon>
        <span class="placeholder">${msg('No booking requests found.')}</span>
      </div>`;

    return html`
      ${this.selectedBookingRequest
        ? html`
            <booking-request-detail
              .bookingRequestHash=${this.selectedBookingRequest}
              @sl-hide=${() => {
                this.selectedBookingRequest = undefined;
              }}
              @booking-request-cancelled=${() => {
                this.selectedBookingRequest = undefined;
              }}
              @booking-request-rejected=${() => {
                this.selectedBookingRequest = undefined;
              }}
              @booking-created=${() => {
                this.selectedBookingRequest = undefined;
              }}
            >
            </booking-request-detail>
          `
        : html``}
      <div style="display: flex; flex-direction: column; flex: 1">
        ${hashes.map(
          hash =>
            html`<booking-request-summary
              .bookingRequestHash=${hash}
              style="margin-bottom: 16px;"
              @booking-request-selected=${() =>
                (this.selectedBookingRequest = hash)}
            ></booking-request-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this.pendingBookingRequests.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        const bookingRequests = this.pendingBookingRequests.value.value;

        const flattened = ([] as EntryRecord<BookingRequest>[]).concat(
          ...Array.from(bookingRequests.values())
        );

        return this.renderList(flattened.map(r => r.actionHash));
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the booking requests')}
          .error=${this.pendingBookingRequests.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
      }
    `,
  ];
}
