import { LitElement, html, css } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  ActionHash,
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import {
  AsyncReadable,
  join,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  hashProperty,
  hashState,
  notify,
  sharedStyles,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/popup/popup.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@scoped-elements/event-calendar';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking, BookingRequest } from '../types.js';

import './booking-summary.js';
import './booking-summary.js';
import './booking-request-detail.js';
import './create-booking-request.js';
import {
  bookingRequestToCalendarEvent,
  bookingToCalendarEvent,
  conflictingTimeSlots,
} from '../utils.js';

/**
 * @element resource-calendar
 */
@localized()
@customElement('resource-calendar')
export class ResourceCalendar extends LitElement {
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
  _bookings = new StoreSubscriber(
    this,
    () =>
      join([
        this.bookieStore.bookingRequestsForResource.get(this.resourceHash),
        this.bookieStore.bookingsForResource.get(this.resourceHash),
      ]) as AsyncReadable<
        [Array<EntryRecord<BookingRequest>>, Array<EntryRecord<Booking>>]
      >,
    () => [this.resourceHash]
  );

  @state()
  newBookingRequestTimeSlot:
    | { startTime: number; endTime: number; element: HTMLElement }
    | undefined;

  @state(hashState())
  selectedBookingRequest: ActionHash | undefined;

  unselect() {
    this.newBookingRequestTimeSlot = undefined;
    (
      this.shadowRoot?.querySelector('event-calendar') as any
    ).calendar.unselect();
  }

  renderCalendar(
    bookingRequests: Array<EntryRecord<BookingRequest>>,
    bookings: Array<EntryRecord<Booking>>
  ) {
    const events = [
      ...bookingRequests.map(bookingRequestToCalendarEvent),
      ...bookings.map(bookingToCalendarEvent),
    ];

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
            ></booking-request-detail>
          `
        : html``}
      <event-calendar
        .events=${events}
        style="flex: 1"
        @event-clicked=${(e: CustomEvent) => {
          const event = e.detail.event;
          if (
            bookingRequests.find(
              request => encodeHashToBase64(request.actionHash) === event.id
            )
          ) {
            // This is a booking request
            this.selectedBookingRequest = decodeHashFromBase64(event.id);
          }
        }}
        @date-selected=${(e: CustomEvent) => {
          const info = e.detail;
          const element = this.shadowRoot
            ?.querySelector('event-calendar')
            ?.shadowRoot?.querySelector('.ec-preview') as HTMLElement;

          if (
            bookings.some(booking =>
              conflictingTimeSlots(
                info.start,
                info.end,
                new Date(Math.floor(booking.entry.start_time / 1000)),
                new Date(Math.floor(booking.entry.end_time / 1000))
              )
            )
          ) {
            this.unselect();
            notify(
              msg(
                "Can't create booking requests for time slots that are already booked."
              )
            );
            return;
          }

          this.newBookingRequestTimeSlot = {
            startTime: info.start,
            endTime: info.end,
            element,
          };
        }}
        .props=${{
          selectable: true,
          unselectAuto: false,
          allDaySlot: false,
          eventClick: (info: any) => {
            info.el.dispatchEvent(
              new CustomEvent('event-clicked', {
                bubbles: true,
                composed: true,
                detail: {
                  event: info.event,
                },
              })
            );
          },
          select: (info: any) => {
            this.shadowRoot?.querySelector('event-calendar')?.dispatchEvent(
              new CustomEvent('date-selected', {
                bubbles: true,
                composed: true,
                detail: { start: info.start, end: info.end },
              })
            );
          },
        }}
        @pointerup=${() => this.unselect()}
      ></event-calendar>
      ${this.newBookingRequestTimeSlot
        ? html`
            <sl-popup
              active
              .anchor=${this.newBookingRequestTimeSlot.element}
              placement="right-start"
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
        return this.renderCalendar(
          this._bookings.value.value[0],
          this._bookings.value.value[1]
        );
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
      sl-popup::part(popup) {
        z-index: 10000;
      }
    `,
  ];
}
