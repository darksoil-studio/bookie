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
import './my-resources-calendar.js';
import './my-booking-requests.js';
import { CreateResource } from './create-resource.js';

@localized()
@customElement('main-dashboard')
export class MainDashboard extends LitElement {
  render() {
    return html`
      <create-resource></create-resource>
      <sl-tab-group placement="start" style="flex: 1">
        <sl-tab slot="nav" disabled>${msg('Book Resources')}</sl-tab>
        <sl-tab slot="nav" panel="all_resources"
          >${msg('All Resources')}</sl-tab
        >
        <sl-tab slot="nav" panel="my_booking_requests"
          >${msg('My Booking Requests')}</sl-tab
        >
        <sl-tab slot="nav" disabled>${msg('Manage Resources')}</sl-tab>
        <sl-tab slot="nav" panel="my_resources">${msg('My Resources')}</sl-tab>
        <sl-tab slot="nav" panel="my_resources_calendar"
          >${msg('My Resources Calendar')}</sl-tab
        >
        <sl-tab slot="nav" panel="my_resources"
          >${msg('Pending Booking Requests')}</sl-tab
        >

        <sl-tab-panel name="all_resources"
          ><all-resources class="tab-content"></all-resources>
        </sl-tab-panel>
        <sl-tab-panel name="my_resources"
          ><my-resources></my-resources>

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
        <sl-tab-panel name="my_resources_calendar">
          <div class="flex-scrollable-parent">
            <div class="flex-scrollable-container">
              <div class="flex-scrollable-y">
                <div class="column">
                  <my-resources-calendar
                    style="margin-top: 16px"
                  ></my-resources-calendar>
                </div>
              </div>
            </div>
          </div>
        </sl-tab-panel>
        <sl-tab-panel name="my_booking_requests">
          <div class="column" style="align-items: center">
            <my-booking-requests
              style="width: 600px; margin-top: 16px"
            ></my-booking-requests></div
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
      sl-tab-group {
        display: flex;
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
      .flex-scrollable-parent {
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
