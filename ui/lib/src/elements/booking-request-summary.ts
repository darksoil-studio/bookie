import { LitElement, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  asyncDeriveAndJoin,
  completed,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';

import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { BookingRequest, Resource } from '../types';

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

  renderSummary(
    bookingRequest: EntryRecord<BookingRequest>,
    resource: EntryRecord<Resource>
  ) {
    return html`
      <div class="column">
        <span
          style="white-space: pre-line;  flex: 1; margin-bottom: 16px"
          class="title"
          >${bookingRequest.entry.title}</span
        >

        <div class="row" style="align-items: center; margin-bottom: 12px">
          <span>${msg('Requestor:')}&nbsp;</span>
          <agent-avatar
            .agentPubKey=${bookingRequest.action.author}
          ></agent-avatar>
        </div>
        <span style="margin-bottom: 16px"
          >${msg('Resource')}:&nbsp;${resource.entry.name}</span
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
    `;
  }

  renderBookingRequest() {
    switch (this._bookingRequest.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._bookingRequest.value.value[0])
          return html`<span
            >${msg("The requested booking request doesn't exist")}</span
          >`;

        return this.renderSummary(
          this._bookingRequest.value.value[0].bookingRequest,
          this._bookingRequest.value.value[1]!
        );
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the booking request')}
          .error=${this._bookingRequest.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('booking-request-selected', {
            composed: true,
            bubbles: true,
            detail: {
              bookingRequestHash: this.bookingRequestHash,
            },
          })
        )}
    >
      ${this.renderBookingRequest()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
