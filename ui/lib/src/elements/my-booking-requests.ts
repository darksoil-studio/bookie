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

/**
 * @element my-booking-requests
 */
@localized()
@customElement('my-booking-requests')
export class MyBookingRequests extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _myBookingRequests = new StoreSubscriber(
    this,
    () => this.bookieStore.myBookingRequests,
    () => []
  );

  @state()
  selectedBookingRequest: ActionHash | undefined;

  @state()
  clearing = false;

  async clearMyBookingRequests(bookingRequestsHashes: Array<ActionHash>) {
    if (this.clearing) return;
    this.clearing = true;

    try {
      await this.bookieStore.client.clearMyBookingRequests(
        bookingRequestsHashes
      );

      this.dispatchEvent(
        new CustomEvent('booking-requests-cleared', {
          bubbles: true,
          composed: true,
          detail: {
            bookingRequestsHashes,
          },
        })
      );
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error rejecting the booking request'));
    }
    this.clearing = false;
  }

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
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
    switch (this._myBookingRequests.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        const myBookingRequests = this._myBookingRequests.value.value;

        const pending = Array.from(myBookingRequests.values())
          .filter(br => br.status.status === 'pending')
          .map(br => br.bookingRequest.actionHash);
        const rejected = Array.from(myBookingRequests.values())
          .filter(br => br.status.status === 'rejected')
          .map(br => br.bookingRequest.actionHash);

        return html` <div class="column" style="flex: 1">
          <span class="title">${msg('Pending')}</span>
          <sl-divider></sl-divider>
          ${this.renderList(pending)}

          <div class="row" style="align-items: center">
            <span class="title" style="flex: 1">${msg('Rejected')}</span>
            <sl-button
              @click=${() => this.clearMyBookingRequests(rejected)}
              .loading=${this.clearing}
              >${msg('Clear')}</sl-button
            >
          </div>
          <sl-divider></sl-divider>
          ${this.renderList(rejected)}
        </div>`;
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the booking requests')}
          .error=${this._myBookingRequests.value.error.data.data}
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
