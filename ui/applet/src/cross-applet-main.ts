import { LitElement, css, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';

import { EntryHash } from '@holochain/client';
import { sharedStyles } from '@holochain-open-dev/elements';
import { lazyLoad, StoreSubscriber } from "@holochain-open-dev/stores";
import { ProfilesClient, ProfilesStore } from "@holochain-open-dev/profiles";
import {
  AppletInfo,
  getAppletsInfosAndGroupsProfiles,
  GroupProfile,
  WeServices,
  weServicesContext,
  AppletClients
} from "@lightningrodlabs/we-applet";
import { consume } from "@lit-labs/context";

@localized()
@customElement('cross-applet-main')
export class CrossAppletMain extends LitElement {
  @property()
  applets!: ReadonlyMap<EntryHash, AppletClients>;

  @consume({ context: weServicesContext, subscribe: true })
  weServices!: WeServices;

  appletsInfo = new StoreSubscriber(
    this,
    () =>
      lazyLoad(async () =>
        getAppletsInfosAndGroupsProfiles(
          this.weServices,
          Array.from(this.applets.keys())
        )
      ),
    () => []
  );

  render() {
    return html``;
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
