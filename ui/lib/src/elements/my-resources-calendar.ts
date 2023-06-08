import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  asyncDeriveAndJoin,
  AsyncReadable,
  join,
  sliceAndJoin,
  StoreSubscriber,
} from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@scoped-elements/event-calendar';

import './resource-summary.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking, BookingRequest, Resource } from '../types.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { mdiInformationOutline } from '@mdi/js';
import { ActionHash } from '@holochain/client';
import {
  bookingRequestToCalendarEvent,
  bookingToCalendarEvent,
  resourceToEventCalendarResource,
} from '../utils.js';

/**
 * @element my-resources-calendar
 */
@localized()
@customElement('my-resources-calendar')
export class MyResourcesCalendar extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _myResources = new StoreSubscriber(
    this,
    () =>
      asyncDeriveAndJoin(
        this.bookieStore.resourcesForAgent.get(
          this.bookieStore.client.client.myPubKey
        ),
        myResources => {
          const resourcesHashes = myResources.map(r => r.actionHash);

          return join([
            sliceAndJoin(
              this.bookieStore.bookingRequestsForResource,
              resourcesHashes
            ),
            sliceAndJoin(this.bookieStore.bookingsForResource, resourcesHashes),
          ]) as AsyncReadable<
            [
              ReadonlyMap<ActionHash, Array<EntryRecord<BookingRequest>>>,
              ReadonlyMap<ActionHash, Array<EntryRecord<Booking>>>
            ]
          >;
        }
      ),
    () => []
  );

  renderCalendar(
    resources: Array<EntryRecord<Resource>>,
    bookingRequests: ReadonlyMap<
      ActionHash,
      Array<EntryRecord<BookingRequest>>
    >,
    bookings: ReadonlyMap<ActionHash, Array<EntryRecord<Booking>>>
  ) {
    if (resources.length === 0)
      return html` <div class="column center-content" style="margin: 16px">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
        ></sl-icon>
        <span class="placeholder"
          >${msg("You haven't created any resources yet")}</span
        >
      </div>`;

    const eventCalendarResources = resources.map(
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
          view: 'resourceTimeGridWeek',
          allDaySlot: false,
          resources: eventCalendarResources,
        }}
      ></event-calendar>
    `;
  }

  render() {
    switch (this._myResources.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderCalendar(
          this._myResources.value.value[0],
          this._myResources.value.value[1][0],
          this._myResources.value.value[1][1]
        );
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the resources')}
          .error=${this._myResources.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
