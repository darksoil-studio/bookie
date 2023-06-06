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
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';

import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking } from '../types.js';

/**
 * @element create-booking
 * @fires booking-created: detail will contain { bookingHash }
 */
@localized()
@customElement('create-booking')
export class CreateBooking extends LitElement {
  // REQUIRED. The booking request hash for this Booking
  @property(hashProperty('booking-request-hash'))
  bookingRequestHash!: ActionHash;

  // REQUIRED. The resource hash for this Booking
  @property(hashProperty('resource-hash'))
  resourceHash!: ActionHash;

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

  async createBooking(fields: any) {
    if (this.committing) return;

    if (this.resourceHash === undefined)
      throw new Error(
        'Cannot create a new Booking without its resource_hash field'
      );

    const booking: Booking = {
      title: fields.title,
      start_time: new Date(fields.start_time).valueOf() * 1000,
      end_time: new Date(fields.end_time).valueOf() * 1000,
      booking_request_hash: this.bookingRequestHash,
      resource_hash: this.resourceHash,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Booking> =
        await this.bookieStore.client.createBooking(booking);

      this.dispatchEvent(
        new CustomEvent('booking-created', {
          composed: true,
          bubbles: true,
          detail: {
            bookingHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the booking'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Booking')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createBooking(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-input name="title" .label=${msg('Title')} required></sl-input>
        </div>

        <div style="margin-bottom: 16px;">
          <sl-input
            name="start_time"
            .label=${msg('Start Time')}
            type="datetime-local"
            @click=${(e: Event) => e.preventDefault()}
            required
          ></sl-input>
        </div>

        <div style="margin-bottom: 16px;">
          <sl-input
            name="end_time"
            .label=${msg('End Time')}
            type="datetime-local"
            @click=${(e: Event) => e.preventDefault()}
            required
          ></sl-input>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Booking')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
