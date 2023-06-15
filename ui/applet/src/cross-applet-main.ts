import { LitElement, css, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { localized, msg } from '@lit/localize';

import { CellType, DnaHash, EntryHash } from '@holochain/client';
import { sharedStyles } from '@holochain-open-dev/elements';
import { lazyLoad, StoreSubscriber } from '@holochain-open-dev/stores';
import { ProfilesClient, ProfilesStore } from '@holochain-open-dev/profiles';
import {
  AppletInfo,
  getAppletsInfosAndGroupsProfiles,
  GroupProfile,
  WeServices,
  weServicesContext,
  AppletClients,
} from '@lightningrodlabs/we-applet';
import { consume } from '@lit-labs/context';

import '@holochain-open-dev/profiles/dist/elements/profiles-context.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { BookieClient, BookieStore } from '@darksoil/bookie';

import '@darksoil/bookie/dist/elements/upcoming-bookings-for-booker.js';

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

  renderBookings(
    applets: ReadonlyMap<EntryHash, AppletInfo>,
    groupsProfiles: ReadonlyMap<DnaHash, GroupProfile>
  ) {
    return html`
      <div class="flex-scrollable-parent" style="margin: 16px">
        <div class="flex-scrollable-container">
          <div class="flex-scrollable-y">
            <div class="column" style="margin: 16px; align-items:center">
              <div class="column" style="width: 700px">
                ${Array.from(this.applets.entries()).map(
                  ([appletId, { appletClient, profilesClient }]) =>
                    html`
                      <profiles-context
                        .store=${new ProfilesStore(profilesClient)}
                      >
                        <bookie-context
                          .store=${new BookieStore(
                            new BookieClient(appletClient, 'bookie')
                          )}
                        >
                          <div
                            class="row "
                            style="align-items: center; margin-top: 16px"
                          >
                            <span class="title"
                              >${msg('Upcoming bookings')} ${msg('in')}&nbsp;
                            </span>
                            ${applets
                              .get(appletId)
                              ?.groupsIds.map(
                                groupId => html`
                                  <img
                                    .src=${groupsProfiles.get(groupId)
                                      ?.logo_src}
                                    alt="group-${groupsProfiles.get(groupId)
                                      ?.name}"
                                    style="margin-right: 4px; height: 32px; width: 32px; border-radius: 50%"
                                  />
                                `
                              )}
                            <span>${applets.get(appletId)?.appletName}</span>
                          </div>
                          <upcoming-bookings-for-booker
                            style="margin-top: 16px"
                            .booker=${appletClient.myPubKey}
                          ></upcoming-bookings-for-booker>
                        </bookie-context>
                      </profiles-context>
                    `
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    switch (this.appletsInfo.value.status) {
      case 'pending':
        return html`<div class="row center-content" style="flex:1">
          <sl-spinner style="font-size: 2rem"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderBookings(
          this.appletsInfo.value.value.appletsInfos,
          this.appletsInfo.value.value.groupsProfiles
        );
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the applets')}
          .error=${this.appletsInfo.value.error}
        ></display-error>`;
    }
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
