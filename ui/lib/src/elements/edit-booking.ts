import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { state, customElement, property } from 'lit/decorators.js';
import { ActionHash, Record, EntryHash, AgentPubKey } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  hashState,
  notifyError,
  sharedStyles,
  hashProperty,
  wrapPathInSvg,
  onSubmit,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { BookieStore } from '../bookie-store';
import { bookieStoreContext } from '../context';
import { Booking } from '../types';

/**
 * @element edit-booking
 * @fires booking-updated: detail will contain { previousBookingHash, updatedBookingHash }
 */
@localized()
@customElement('edit-booking')
export class EditBooking extends LitElement {
  // REQUIRED. The current Booking record that should be updated
  @property()
  currentRecord!: EntryRecord<Booking>;

  /**
   * @internal
   */
  @consume({ context: bookieStoreContext })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  firstUpdated() {
    this.shadowRoot?.querySelector('form')!.reset();
  }

  async updateBooking(fields: any) {
    const booking: Booking = {
      title: fields.title,
      bookers: this.currentRecord.entry.bookers,
      start_time: new Date(fields.start_time).valueOf() * 1000,
      end_time: new Date(fields.end_time).valueOf() * 1000,
      booking_request_hash: this.currentRecord.entry.booking_request_hash,
      resource_hash: this.currentRecord.entry.resource_hash,
    };

    try {
      this.committing = true;
      const updateRecord = await this.bookieStore.client.updateBooking(
        this.currentRecord.actionHash,
        booking
      );

      this.dispatchEvent(
        new CustomEvent('booking-updated', {
          composed: true,
          bubbles: true,
          detail: {
            previousBookingHash: this.currentRecord.actionHash,
            updatedBookingHash: updateRecord.actionHash,
          },
        })
      );
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error updating the booking'));
    }

    this.committing = false;
  }

  render() {
    return html` <sl-card>
      <span slot="header">${msg('Edit Booking')}</span>

      <form
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.updateBooking(fields))}
      >
        <div style="margin-bottom: 16px">
          <sl-input
            name="title"
            .label=${msg('Title')}
            required
            .defaultValue=${this.currentRecord.entry.title}
          ></sl-input>
        </div>

        <div style="margin-bottom: 16px">
          <sl-input
            name="start_time"
            .label=${msg('Start Time')}
            type="datetime-local"
            @click=${(e: Event) => e.preventDefault()}
            required
            .defaultValue=${new Date(
              this.currentRecord.entry.start_time / 1000
            ).toLocaleString()}
          ></sl-input>
        </div>

        <div style="margin-bottom: 16px">
          <sl-input
            name="end_time"
            .label=${msg('End Time')}
            type="datetime-local"
            @click=${(e: Event) => e.preventDefault()}
            required
            .defaultValue=${new Date(
              this.currentRecord.entry.end_time / 1000
            ).toLocaleString()}
          ></sl-input>
        </div>

        <div style="display: flex; flex-direction: row">
          <sl-button
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('edit-canceled', {
                  bubbles: true,
                  composed: true,
                })
              )}
            style="flex: 1;"
            >${msg('Cancel')}</sl-button
          >
          <sl-button
            type="submit"
            variant="primary"
            style="flex: 1;"
            .loading=${this.committing}
            >${msg('Save')}</sl-button
          >
        </div>
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
