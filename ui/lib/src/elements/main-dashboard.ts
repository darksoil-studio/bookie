import { sharedStyles } from '@holochain-open-dev/elements';
import { localized, msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

import './all-resources.js';
import './create-resource.js';
import './my-resources.js';
import './my-booking-requests.js';
import { CreateResource } from './create-resource.js';

@localized()
@customElement('main-dashboard')
export class MainDashboard extends LitElement {
  render() {
    return html`
      <create-resource></create-resource>
      <sl-tab-group placement="start" style="flex: 1">
        <sl-tab slot="nav" panel="all_resources"
          >${msg('All Resources')}</sl-tab
        >
        <sl-tab slot="nav" panel="my_resources">${msg('My Resources')}</sl-tab>
        <sl-tab slot="nav" panel="my_booking_requests"
          >${msg('My Booking Requests')}</sl-tab
        >

        <sl-tab-panel name="all_resources"
          ><all-resources class="tab-content"></all-resources>
          <sl-button
            @click=${() =>
              (
                this.shadowRoot?.querySelector(
                  'create-resource'
                ) as CreateResource
              ).open()}
            variant="primary"
            style="position: absolute; right: 16px; bottom: 16px"
            >${msg('Create Resource')}</sl-button
          >
        </sl-tab-panel>
        <sl-tab-panel name="my_resources"
          ><my-resources></my-resources
        ></sl-tab-panel>
        <sl-tab-panel name="my_booking_requests"
          ><my-booking-requests></my-booking-requests
        ></sl-tab-panel>
      </sl-tab-group>
    `;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex: 1;
      }
      sl-tab-group::part(base) {
        display: flex;
        flex: 1;
      }
      sl-tab-group::part(body) {
        display: flex;
        flex: 1;
      }
      sl-tab-panel::part(base) {
        width: 100%;
        height: 100%;
      }
      sl-tab-panel {
        width: 100%;
      }
    `,
    sharedStyles,
  ];
}
