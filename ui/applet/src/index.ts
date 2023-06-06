import '@darksoil/bookie/dist/elements/booking-detail.js';
import '@darksoil/bookie/dist/elements/booking-request-detail.js';
import '@darksoil/bookie/dist/elements/resource-detail.js';
import '@darksoil/bookie/dist/elements/bookie-context.js';

import { BookieStore, BookieClient } from '@darksoil/bookie';

import {
  ActionHash,
  AppAgentClient,
  CellType,
  EntryHash,
} from '@holochain/client';
import { html, render, TemplateResult } from 'lit';

import { ProfilesClient, ProfilesStore } from '@holochain-open-dev/profiles';
import { FileStorageClient } from '@holochain-open-dev/file-storage';
import '@holochain-open-dev/file-storage/dist/elements/file-storage-context.js';

import '@holochain-open-dev/profiles/dist/elements/profiles-context.js';
import '@lightningrodlabs/we-applet/dist/elements/we-services-context.js';
import '@lightningrodlabs/we-applet/dist/elements/hrl-link.js';

import {
  Hrl,
  AppletViews,
  CrossAppletViews,
  WeApplet,
  AppletClients,
  WeServices,
} from '@lightningrodlabs/we-applet';

import './applet-main';
import './cross-applet-main';

function wrapAppletView(
  client: AppAgentClient,
  profilesClient: ProfilesClient,
  weServices: WeServices,
  innerTemplate: TemplateResult
): TemplateResult {
  const bookieStore = new BookieStore(new BookieClient(client, 'bookie'));
  const fileStorageClient = new FileStorageClient(client, 'bookie');
  return html`
    <we-services-context .services=${weServices}>
      <profiles-context .store=${new ProfilesStore(profilesClient)}>
        <bookie-context .store=${bookieStore}>
          <file-storage-context .client=${fileStorageClient}>
            ${innerTemplate}
          </file-storage-context>
        </bookie-context>
      </profiles-context>
    </we-services-context>
  `;
}

async function appletViews(
  client: AppAgentClient,
  appletId: EntryHash,
  profilesClient: ProfilesClient,
  weServices: WeServices
): Promise<AppletViews> {
  return {
    main: element =>
      render(
        wrapAppletView(
          client,
          profilesClient,
          weServices,
          html` <applet-main></applet-main> `
        ),
        element
      ),
    blocks: {},
    entries: {
      bookie: {
        bookie_integrity: {
          booking: {
            info: async (hrl: Hrl) => ({
              name: '',
              icon_src: '',
            }),
            view: (element: HTMLElement, hrl: Hrl, context: any) =>
              render(
                wrapAppletView(
                  client,
                  profilesClient,
                  weServices,
                  html`
                    <booking-detail .bookingHash=${hrl[1]}></booking-detail>
                  `
                ),
                element
              ),
          },

          booking_request: {
            info: async (hrl: Hrl) => ({
              name: '',
              icon_src: '',
            }),
            view: (element: HTMLElement, hrl: Hrl, context: any) =>
              render(
                wrapAppletView(
                  client,
                  profilesClient,
                  weServices,
                  html`
                    <booking-request-detail
                      .bookingRequestHash=${hrl[1]}
                    ></booking-request-detail>
                  `
                ),
                element
              ),
          },

          resource: {
            info: async (hrl: Hrl) => ({
              name: '',
              icon_src: '',
            }),
            view: (element: HTMLElement, hrl: Hrl, context: any) =>
              render(
                wrapAppletView(
                  client,
                  profilesClient,
                  weServices,
                  html`
                    <resource-detail .resourceHash=${hrl[1]}></resource-detail>
                  `
                ),
                element
              ),
          },
        },
      },
    },
  };
}

async function crossAppletViews(
  applets: ReadonlyMap<EntryHash, AppletClients>, // Segmented by appletId
  weServices: WeServices
): Promise<CrossAppletViews> {
  return {
    main: element =>
      render(
        html`
          <we-services-context .services=${weServices}>
            <cross-applet-main .applets=${applets}></cross-applet-main>
          </we-services-context>
        `,
        element
      ),
    blocks: {},
  };
}

const applet: WeApplet = {
  appletViews,
  crossAppletViews,
  attachmentTypes: async (appletClient: AppAgentClient) => ({}),
  search: async (
    appletClient: AppAgentClient,
    appletId: EntryHash,
    weServices: WeServices,
    filter: string
  ) => {
    return [];
  },
};

export default applet;
