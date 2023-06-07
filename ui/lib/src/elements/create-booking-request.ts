import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { state, property, query, customElement } from 'lit/decorators.js';
import {
  ActionHash,
  Record,
  DnaHash,
  AgentPubKey,
  EntryHash,
} from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  hashProperty,
  notifyError,
  hashState,
  sharedStyles,
  onSubmit,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { BookingRequest } from '../types.js';

/**
 * @element create-booking-request
 * @fires booking-request-created: detail will contain { bookingRequestHash }
 */
@localized()
@customElement('create-booking-request')
export class CreateBookingRequest extends LitElement {
  // REQUIRED. The resource hash for this BookingRequest
  @property(hashProperty('resource-hash'))
  resourceHash!: ActionHash;

  // REQUIRED. The start time for this BookingRequest
  @property()
  startTime!: number;

  // REQUIRED. The end time for this BookingRequest
  @property()
  endTime!: number;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  async createBookingRequest(fields: any) {
    if (this.committing) return;

    if (this.resourceHash === undefined)
      throw new Error(
        'Cannot create a new Booking Request without its resource_hash field'
      );
    if (this.startTime === undefined)
      throw new Error(
        'Cannot create a new Booking Request without its start_time field'
      );
    if (this.endTime === undefined)
      throw new Error(
        'Cannot create a new Booking Request without its end_time field'
      );

    const bookingRequest: BookingRequest = {
      resource_hash: this.resourceHash,
      title: fields.title,
      comment: fields.comment,
      start_time: this.startTime * 1000,
      end_time: this.endTime * 1000,
    };

    try {
      this.committing = true;
      const record: EntryRecord<BookingRequest> =
        await this.bookieStore.client.createBookingRequest(bookingRequest);

      this.dispatchEvent(
        new CustomEvent('booking-request-created', {
          composed: true,
          bubbles: true,
          detail: {
            bookingRequestHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the booking request'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Booking Request')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createBookingRequest(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-input name="title" .label=${msg('Title')} required></sl-input>
        </div>

        <div style="margin-bottom: 16px;">
          <sl-textarea
            name="comment"
            .label=${msg('Comment')}
            required
          ></sl-textarea>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Booking Request')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
