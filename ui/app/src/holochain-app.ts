import {
  fileStorageClientContext,
  FileStorageClient,
} from '@holochain-open-dev/file-storage';

import {
  bookieStoreContext,
  BookieStore,
  BookieClient,
} from '@darksoil/bookie';

// Replace 'ligth.css' with 'dark.css' if you want the dark theme
import '@shoelace-style/shoelace/dist/themes/light.css';

import { LitElement, css, html } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import {
  AppAgentWebsocket,
  AppAgentClient,
  ActionHash,
} from '@holochain/client';
import { AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';
import { provide } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import {
  Profile,
  ProfilesClient,
  ProfilesStore,
  profilesStoreContext,
} from '@holochain-open-dev/profiles';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import '@holochain-open-dev/profiles/dist/elements/profile-prompt.js';
import '@holochain-open-dev/profiles/dist/elements/profile-list-item-skeleton.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import '@darksoil/bookie/dist/elements/main-dashboard.js';
import '@darksoil/bookie/dist/elements/resource-detail.js';
import '@darksoil/bookie/dist/elements/booking-request-detail.js';
import { mdiArrowLeft } from '@mdi/js';

type View =
  | { view: 'main' }
  | { view: 'resource_detail'; resourceHash: ActionHash }
  | { view: 'booking_request_detail'; bookingRequestHash: ActionHash };

@localized()
@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @provide({ context: fileStorageClientContext })
  @property()
  _fileStorageClient!: FileStorageClient;

  @provide({ context: bookieStoreContext })
  @property()
  _bookieStore!: BookieStore;

  @state() _loading = true;

  @state() _view: View = { view: 'main' };

  @provide({ context: profilesStoreContext })
  @property()
  _profilesStore!: ProfilesStore;

  _client!: AppAgentClient;

  _myProfile!: StoreSubscriber<AsyncStatus<Profile | undefined>>;

  async firstUpdated() {
    this._client = await AppAgentWebsocket.connect('', 'bookie');

    await this.initStores(this._client);

    this._loading = false;
  }

  async initStores(appAgentClient: AppAgentClient) {
    // Don't change this
    this._profilesStore = new ProfilesStore(
      new ProfilesClient(appAgentClient, 'bookie')
    );
    this._myProfile = new StoreSubscriber(
      this,
      () => this._profilesStore.myProfile
    );
    this._bookieStore = new BookieStore(
      new BookieClient(appAgentClient, 'bookie')
    );
    this._fileStorageClient = new FileStorageClient(appAgentClient, 'bookie');
  }

  renderMyProfile() {
    switch (this._myProfile.value.status) {
      case 'pending':
        return html`<profile-list-item-skeleton></profile-list-item-skeleton>`;
      case 'complete':
        const profile = this._myProfile.value.value;
        if (!profile) return html``;

        return html`<div
          class="row"
          style="align-items: center;"
          slot="actionItems"
        >
          <agent-avatar .agentPubKey=${this._client.myPubKey}></agent-avatar>
          <span style="margin: 0 16px;">${profile?.nickname}</span>
        </div>`;
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the profile')}
          .error=${this._myProfile.value.error.data.data}
          tooltip
        ></display-error>`;
    }
  }

  renderContent() {
    if (this._view.view === 'resource_detail')
      return html`<resource-detail
        .resourceHash=${this._view.resourceHash}
        style="flex: 1"
        @booking-request-selected=${(e: CustomEvent) => {
          this._view = {
            view: 'booking_request_detail',
            bookingRequestHash: e.detail.bookingRequestHash,
          };
        }}
      ></resource-detail>`;
    if (this._view.view === 'booking_request_detail')
      return html`<booking-request-detail
        .bookingRequestHash=${this._view.bookingRequestHash}
        style="flex: 1"
      ></booking-request-detail>`;

    return html`
      <main-dashboard
        @resource-selected=${(e: CustomEvent) => {
          this._view = {
            view: 'resource_detail',
            resourceHash: e.detail.resourceHash,
          };
        }}
        @booking-request-selected=${(e: CustomEvent) => {
          this._view = {
            view: 'booking_request_detail',
            bookingRequestHash: e.detail.bookingRequestHash,
          };
        }}
      ></main-dashboard>
    `;
  }

  renderBackButton() {
    if (this._view.view === 'main') return html``;

    return html`
      <sl-icon-button
        .src=${wrapPathInSvg(mdiArrowLeft)}
        @click=${() => {
          this._view = { view: 'main' };
        }}
        style="color: white; margin-right: 16px"
      ></sl-icon-button>
    `;
  }

  render() {
    if (this._loading)
      return html`<div
        class="row"
        style="flex: 1; height: 100%; align-items: center; justify-content: center;"
      >
        <sl-spinner style="font-size: 2rem"></sl-spinner>
      </div>`;

    return html`
      <div class="column fill">
        <div
          class="row"
          style="align-items: center; color:white; background-color: var(--sl-color-primary-900); padding: 16px"
        >
          ${this.renderBackButton()}
          <span class="title" style="flex: 1">${msg('Bookie')}</span>

          ${this.renderMyProfile()}
        </div>

        <profile-prompt style="flex: 1;">
          ${this.renderContent()}
        </profile-prompt>
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        display: flex;
        flex: 1;
      }
    `,
    sharedStyles,
  ];
}
