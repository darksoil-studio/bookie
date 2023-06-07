import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  Record,
  EntryHash,
  ActionHash,
  AgentPubKey,
  encodeHashToBase64,
} from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';
import {
  hashProperty,
  notify,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/popup/popup.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@scoped-elements/event-calendar';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking } from '../types.js';

import './booking-summary.js';
import './create-booking-request.js';

function conflictingTimeSlots(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

/**
 * @element bookings-for-resource
 */
@localized()
@customElement('bookings-for-resource')
export class BookingsForResource extends LitElement {
  // REQUIRED. The ResourceHash for which the Bookings should be fetched
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
  _bookings = new StoreSubscriber(this, () =>
    this.bookieStore.bookingsForResource.get(this.resourceHash)
  );

  @state()
  newBookingRequestTimeSlot:
    | { startTime: number; endTime: number; element: HTMLElement }
    | undefined;

  unselect() {
    this.newBookingRequestTimeSlot = undefined;
    (
      this.shadowRoot?.querySelector('event-calendar') as any
    ).calendar.unselect();
  }

  renderCalendar(bookings: Array<EntryRecord<Booking>>) {
    const events = bookings.map(b => ({
      id: encodeHashToBase64(b.actionHash),
      allDay: false,
      title: b.entry.title,
      extendedProps: {},
      resourceIds: [],
      display: 'auto',
      durationEditable: false,
      editable: false,
      startEditable: false,
      start: new Date(Math.floor(b.entry.start_time / 1000)),
      end: new Date(Math.floor(b.entry.end_time / 1000)),
    }));

    return html`
      <event-calendar
        .events=${events}
        style="flex: 1"
        .props=${{
          selectable: true,
          unselectAuto: false,
          select: (info: any) => {
            const element = this.shadowRoot
              ?.querySelector('event-calendar')
              ?.shadowRoot?.querySelector('.ec-preview') as HTMLElement;

            if (
              events.some(e =>
                conflictingTimeSlots(info.start, info.end, e.start, e.end)
              )
            ) {
              this.unselect();
              notify(
                msg(
                  "Can't create booking requests for time slots that are already booked."
                )
              );
            }

            this.newBookingRequestTimeSlot = {
              startTime: info.start,
              endTime: info.end,
              element,
            };
          },
        }}
        @pointerup=${() => this.unselect()}
      ></event-calendar>
      ${this.newBookingRequestTimeSlot
        ? html`
            <sl-popup
              active
              .anchor=${this.newBookingRequestTimeSlot.element}
              placement="right"
              distance="8"
            >
              <create-booking-request
                .resourceHash=${this.resourceHash}
                .startTime=${this.newBookingRequestTimeSlot.startTime}
                .endTime=${this.newBookingRequestTimeSlot.endTime}
                @booking-request-created=${() => this.unselect()}
              ></create-booking-request>
            </sl-popup>
          `
        : html``}
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
        return this.renderCalendar(this._bookings.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the bookings')}
          .error=${this._bookings.value.error.data.data}
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
