import '@darksoil/bookie/dist/elements/booking-detail.js';
import '@darksoil/bookie/dist/elements/booking-request-detail.js';
import '@darksoil/bookie/dist/elements/resource-detail.js';
import '@darksoil/bookie/dist/elements/all-resources.js';
import '@darksoil/bookie/dist/elements/bookie-context.js';

import { BookieStore, BookieClient, RequestStatus } from '@darksoil/bookie';

import { AppAgentClient, CellType, EntryHash } from '@holochain/client';
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

import {
  wrapPathInSvg,
  wrapPathInSvgWithoutPrefix,
} from '@holochain-open-dev/elements';
import {
  mdiCalendarCheck,
  mdiCalendarQuestion,
  mdiCalendarRemove,
  mdiTableClock,
  mdiTimetable,
} from '@mdi/js';
import { toPromise } from '@holochain-open-dev/stores';
import {
  AttachmentsClient,
  AttachmentsStore,
} from '@lightningrodlabs/attachments';
import '@lightningrodlabs/attachments/dist/elements/attachments-context.js';
import '@lightningrodlabs/attachments/dist/elements/attachments-card.js';

import './applet-main';
import './cross-applet-main';
import { msg } from '@lit/localize';

function wrapAppletView(
  client: AppAgentClient,
  profilesClient: ProfilesClient,
  weServices: WeServices,
  innerTemplate: TemplateResult
): TemplateResult {
  const bookieStore = new BookieStore(new BookieClient(client, 'bookie'));
  const fileStorageClient = new FileStorageClient(client, 'bookie');
  return html`
    <attachments-context
      .store=${new AttachmentsStore(new AttachmentsClient(client, 'bookie'))}
    >
      <we-services-context .services=${weServices}>
        <profiles-context .store=${new ProfilesStore(profilesClient)}>
          <bookie-context .store=${bookieStore}>
            <file-storage-context .client=${fileStorageClient}>
              ${innerTemplate}
            </file-storage-context>
          </bookie-context>
        </profiles-context>
      </we-services-context>
    </attachments-context>
  `;
}

function bookingRequestIconByStatus(status: RequestStatus) {
  if (status.status === 'pending') return mdiCalendarQuestion;
  else if (status.status === 'accepted') return mdiCalendarCheck;
  else return mdiCalendarRemove;
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
          html`
            <applet-main
              @resource-selected=${async (e: CustomEvent) => {
                const appInfo = await client.appInfo();
                const dnaHash = (appInfo.cell_info.bookie[0] as any)[
                  CellType.Provisioned
                ].cell_id[0];
                weServices.openViews.openHrl(
                  [dnaHash, e.detail.resourceHash],
                  {}
                );
              }}
            ></applet-main>
          `
        ),
        element
      ),
    blocks: {
      all_resources: {
        label: msg('All Resources'),
        icon_src: wrapPathInSvgWithoutPrefix(mdiTableClock),
        view(element, context) {
          render(
            wrapAppletView(
              client,
              profilesClient,
              weServices,
              html`
                <all-resources
                  @resource-selected=${async (e: CustomEvent) => {
                    const appInfo = await client.appInfo();
                    const dnaHash = (appInfo.cell_info.bookie[0] as any)[
                      CellType.Provisioned
                    ].cell_id[0];
                    weServices.openViews.openHrl(
                      [dnaHash, e.detail.resourceHash],
                      {}
                    );
                  }}
                ></all-resources>
              `
            ),
            element
          );
        },
      },
    },
    entries: {
      bookie: {
        bookie_integrity: {
          booking: {
            info: async (hrl: Hrl) => {
              const bookieClient = new BookieClient(client, 'bookie');
              const booking = await bookieClient.getBooking(hrl[1]);
              if (!booking) return undefined;

              return {
                name: booking.entry.title,
                icon_src: wrapPathInSvg(mdiCalendarCheck),
              };
            },
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
            info: async (hrl: Hrl) => {
              const bookieStore = new BookieStore(
                new BookieClient(client, 'bookie')
              );
              const bookingRequest = await toPromise(
                bookieStore.bookingRequests.get(hrl[1])
              );
              if (!bookingRequest) return undefined;

              return {
                name: bookingRequest.bookingRequest.entry.title,
                icon_src: wrapPathInSvg(
                  bookingRequestIconByStatus(bookingRequest.status)
                ),
              };
            },
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
            info: async (hrl: Hrl) => {
              const bookieClient = new BookieClient(client, 'bookie');
              const resource = await bookieClient.getResource(hrl[1]);
              if (!resource) return undefined;

              return {
                name: resource.entry.name,
                icon_src: wrapPathInSvg(mdiTimetable),
              };
            },
            view: (element: HTMLElement, hrl: Hrl, context: any) =>
              render(
                wrapAppletView(
                  client,
                  profilesClient,
                  weServices,
                  html`
                    <resource-detail .resourceHash=${hrl[1]}>
                      <attachments-card
                        slot="attachments"
                        .hash=${hrl[1]}
                      ></attachments-card>
                    </resource-detail>
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
    const bookieClient = new BookieClient(appletClient, 'bookie');

    const resources = await bookieClient.getAllResources();

    const filteredResources = resources
      .filter(e => !!e && e.entry.name.includes(filter))
      .map(e => e!.actionHash);

    const appInfo = await appletClient.appInfo();
    const dnaHash = (appInfo.cell_info.bookie[0] as any)[CellType.Provisioned]
      .cell_id[0];

    return filteredResources.map(hash => ({
      hrl: [dnaHash, hash],
      context: {},
    }));
  },
};

export default applet;
