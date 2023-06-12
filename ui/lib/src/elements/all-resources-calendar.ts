import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import {
  asyncDeriveAndJoin,
  AsyncReadable,
  join,
  pipe,
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

import './resources-calendar.js';
import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Booking, BookingRequest, Resource } from '../types.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { mdiInformationOutline } from '@mdi/js';
import { ActionHash } from '@holochain/client';

/**
 * @element all-resources-calendar
 */
@localized()
@customElement('all-resources-calendar')
export class AllResourcesCalendar extends LitElement {
  /**
   * @internal
   */
  @consume({ context: bookieStoreContext, subscribe: true })
  bookieStore!: BookieStore;

  /**
   * @internal
   */
  _allResources = new StoreSubscriber(
    this,
    () =>
      pipe(this.bookieStore.allResources, allResources =>
        sliceAndJoin(this.bookieStore.resources, allResources)
      ),
    () => []
  );

  renderCalendar(resources: ReadonlyMap<ActionHash, EntryRecord<Resource>>) {
    if (resources.size === 0)
      return html` <div class="column center-content" style="margin: 16px">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
        ></sl-icon>
        <span class="placeholder"
          >${msg("You haven't created any resources yet")}</span
        >
      </div>`;

    return html`
      <resources-calendar
        view="resourceTimeGridDay"
        .resourcesHashes=${Array.from(resources.keys())}
      ></resources-calendar>
    `;
  }

  render() {
    switch (this._allResources.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderCalendar(this._allResources.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the resources')}
          .error=${this._allResources.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
