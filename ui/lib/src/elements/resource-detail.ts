import { LitElement, html, css } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import {
  sharedStyles,
  hashProperty,
  wrapPathInSvg,
  notifyError,
} from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

import '@holochain-open-dev/file-storage/dist/elements/show-image.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import './edit-resource.js';
import './resource-calendar.js';
import './booking-requests-for-resource.js';

import { BookieStore } from '../bookie-store.js';
import { bookieStoreContext } from '../context.js';
import { Resource } from '../types.js';

/**
 * @element resource-detail
 * @fires resource-deleted: detail will contain { resourceHash }
 */
@localized()
@customElement('resource-detail')
export class ResourceDetail extends LitElement {
  // REQUIRED. The hash of the Resource to show
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
  _resource = new StoreSubscriber(
    this,
    () => this.bookieStore.resources.get(this.resourceHash),
    () => [this.resourceHash]
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  /**
   * @internal
   */
  @state()
  deleting = false;

  async deleteResource() {
    if (this.deleting) return;
    this.deleting = true;
    try {
      await this.bookieStore.client.deleteResource(this.resourceHash);

      this.dispatchEvent(
        new CustomEvent('resource-deleted', {
          bubbles: true,
          composed: true,
          detail: {
            resourceHash: this.resourceHash,
          },
        })
      );
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error deleting the resource'));
    }
    this.deleting = false;
  }

  renderDetail(entryRecord: EntryRecord<Resource>) {
    return html`
      <div class="column" style="align-items: center; margin-top: 32px">
        <div class="row">
          <sl-card style="max-width: 600px; margin-right: 16px">
            <show-image
              slot="image"
              .imageHash=${entryRecord.entry.image_hash}
            ></show-image>
            <div
              slot="header"
              style="display: flex; flex-direction: row; align-items: center"
            >
              <span style="font-size: 18px; flex: 1;"
                >${entryRecord.entry.name}</span
              >

              ${entryRecord.action.author.toString() ===
              this.bookieStore.client.client.myPubKey.toString()
                ? html`
                    <sl-icon-button
                      style="margin-left: 8px"
                      .src=${wrapPathInSvg(mdiPencil)}
                      @click=${() => {
                        this._editing = true;
                      }}
                    ></sl-icon-button>
                    <sl-icon-button
                      style="margin-left: 8px"
                      .src=${wrapPathInSvg(mdiDelete)}
                      @click=${() => this.deleteResource()}
                      .loading=${this.deleting}
                    ></sl-icon-button>
                  `
                : html``}
            </div>

            <div style="display: flex; flex-direction: column">
              <div
                style="display: flex; flex-direction: column; margin-bottom: 16px"
              >
                <span style="margin-bottom: 8px"
                  ><strong>${msg('Description')}:</strong></span
                >
                <span style="white-space: pre-line"
                  >${entryRecord.entry.description}</span
                >
              </div>
            </div>
          </sl-card>

          <div class="column">
            <slot name="attachments"></slot>
          </div>
        </div>
      </div>
    `;
  }

  renderTabs(resource: EntryRecord<Resource>) {
    return html` <div class="column" style="flex: 1">
      <span class="title" style=" margin: 16px"> ${resource.entry.name}</span>
      <sl-tab-group style="display: flex; flex: 1">
        <sl-tab slot="nav" panel="calendar">${msg('Bookings')}</sl-tab>
        <sl-tab slot="nav" panel="details">${msg('Resource Details')}</sl-tab>

        <sl-tab-panel name="calendar">
          <div class="flex-scrollable-parent">
            <div class="flex-scrollable-container">
              <div class="flex-scrollable-y">
                <div class="column">
                  <resource-calendar
                    style="margin: 16px"
                    .resourceHash=${this.resourceHash}
                  ></resource-calendar>
                </div>
              </div>
            </div>
          </div>
        </sl-tab-panel>
        <sl-tab-panel name="details">
          ${this.renderDetail(resource)}
        </sl-tab-panel>
      </sl-tab-group>
    </div>`;
  }

  render() {
    switch (this._resource.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const resource = this._resource.value.value;

        if (!resource)
          return html`<span
            >${msg("The requested resource doesn't exist")}</span
          >`;

        if (this._editing) {
          return html` <div
            class="column"
            style="flex: 1; align-items: center; margin: 16px"
          >
            <edit-resource
              .originalResourceHash=${this.resourceHash}
              .currentRecord=${resource}
              @resource-updated=${async () => {
                this._editing = false;
              }}
              @edit-canceled=${() => {
                this._editing = false;
              }}
              style="display: flex; width: 600px"
            ></edit-resource>
          </div>`;
        }

        return this.renderTabs(resource);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the resource')}
            .error=${this._resource.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [
    sharedStyles,
    css`
      :host {
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
      sl-tab-panel {
        width: 100%;
      }
      .flex-scrollable-parent {
        width: 100%;
        height: 100%;
      }
      sl-tab-panel::part(base) {
        padding: 0 !important;
      }
    `,
  ];
}
