import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  AsyncReadable,
  join,
  sliceAndJoin,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { sharedStyles } from '@holochain-open-dev/elements';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@scoped-elements/event-calendar';

import './resource-summary.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking, BookingRequest, Resource } from '../types.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import {
  bookingRequestToCalendarEvent,
  bookingToCalendarEvent,
  resourceToEventCalendarResource,
} from '../utils.js';

/**
 * @element resources-calendar
 */
@localized()
@customElement('resources-calendar')
export class ResourcesCalendar extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  @property()
  resourcesHashes!: Array<ActionHash>;

  @property()
  view = 'resourceTimeGridWeek';

  /**
   * @internal
   */
  _resources = new StoreSubscriber(
    this,
    () =>
      join([
        sliceAndJoin(this.bookieStore.resources, this.resourcesHashes),
        sliceAndJoin(
          this.bookieStore.bookingRequestsForResource,
          this.resourcesHashes
        ),
        sliceAndJoin(
          this.bookieStore.bookingsForResource,
          this.resourcesHashes
        ),
      ]) as AsyncReadable<
        [
          ReadonlyMap<ActionHash, EntryRecord<Resource>>,
          ReadonlyMap<ActionHash, Array<EntryRecord<BookingRequest>>>,
          ReadonlyMap<ActionHash, Array<EntryRecord<Booking>>>
        ]
      >,
    () => [this.resourcesHashes]
  );

  renderCalendar(
    resources: ReadonlyMap<ActionHash, EntryRecord<Resource>>,
    bookingRequests: ReadonlyMap<
      ActionHash,
      Array<EntryRecord<BookingRequest>>
    >,
    bookings: ReadonlyMap<ActionHash, Array<EntryRecord<Booking>>>
  ) {
    const eventCalendarResources = Array.from(resources.values()).map(
      resourceToEventCalendarResource
    );
    const events = [
      ...([] as EntryRecord<BookingRequest>[])
        .concat(...Array.from(bookingRequests.values()))
        .map(bookingRequestToCalendarEvent),
      ...([] as EntryRecord<Booking>[])
        .concat(...Array.from(bookings.values()))
        .map(bookingToCalendarEvent),
    ];
    return html`
      <event-calendar
        .events=${events}
        .props=${{
          headerToolbar: {
            start: 'title',
            center: '',
            end: 'resourceTimeGridWeek resourceTimeGridDay today prev,next',
          },
          view: this.view,
          allDaySlot: false,
          resources: eventCalendarResources,
        }}
      ></event-calendar>
    `;
  }

  render() {
    switch (this._resources.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderCalendar(
          this._resources.value.value[0],
          this._resources.value.value[1],
          this._resources.value.value[2]
        );
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the resources')}
          .error=${this._resources.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
