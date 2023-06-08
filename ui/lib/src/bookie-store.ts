import { Booking } from './types';

import { BookingRequest } from './types';

import { Resource } from './types';

import {
  lazyLoadAndPoll,
  AsyncReadable,
  pipe,
  completed,
  asyncDeriveAndJoin,
  asyncDeriveStore,
  asyncDerived,
  sliceAndJoin,
} from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap } from '@holochain-open-dev/utils';
import {
  NewEntryAction,
  Record,
  ActionHash,
  EntryHash,
  AgentPubKey,
} from '@holochain/client';

import { BookieClient } from './bookie-client.js';

export type RequestStatus =
  | {
      status: 'pending';
    }
  | {
      status: 'rejected';
    }
  | {
      status: 'cancelled';
    }
  | {
      status: 'accepted';
      bookingHash: ActionHash;
    };

export class BookieStore {
  constructor(public client: BookieClient) {}

  /** Resource */

  resources = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getResource(resourceHash), 4000)
  );

  /** Booking Request */

  bookingRequests: LazyHoloHashMap<
    ActionHash,
    AsyncReadable<
      | { bookingRequest: EntryRecord<BookingRequest>; status: RequestStatus }
      | undefined
    >
  > = new LazyHoloHashMap((bookingRequestHash: ActionHash) =>
    pipe(
      lazyLoadAndPoll(
        async () => this.client.getBookingRequest(bookingRequestHash),
        4000
      ),
      requestAndDeletes => {
        console.log(requestAndDeletes);
        if (!requestAndDeletes) return completed(undefined);

        const bookingRequest = requestAndDeletes.bookingRequest;
        if (requestAndDeletes.deletes.length > 0) {
          if (
            requestAndDeletes.deletes[0].hashed.content.author.toString() ===
            this.client.client.myPubKey.toString()
          ) {
            return completed({
              status: {
                status: 'cancelled',
              } as RequestStatus,
              bookingRequest,
            });
          } else {
            return completed({
              status: {
                status: 'rejected',
              } as RequestStatus,
              bookingRequest,
            });
          }
        } else {
          return asyncDerived(
            this.bookingsForBookingRequest.get(bookingRequestHash),
            bookings => {
              console.log('hey');
              if (bookings.length > 0) {
                return {
                  status: {
                    status: 'accepted',
                    bookingHash: bookings[0],
                  } as RequestStatus,
                  bookingRequest,
                };
              } else {
                return {
                  status: {
                    status: 'pending',
                  } as RequestStatus,
                  bookingRequest,
                };
              }
            }
          );
        }
      }
    )
  );

  bookingRequestsForResource = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getBookingRequestsForResource(resourceHash),
      4000
    )
  );

  /** Booking */

  bookings = new LazyHoloHashMap((bookingHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getBooking(bookingHash), 4000)
  );

  bookingsForBookingRequest = new LazyHoloHashMap(
    (bookingRequestHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records = await this.client.getBookingsForBookingRequest(
          bookingRequestHash
        );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  bookingsForResource = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getBookingsForResource(resourceHash),
      4000
    )
  );

  /** All Resources */

  allResources = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllResources();
    return records.map(r => r.actionHash);
  }, 4000);

  /** My Resources */

  resourcesForAgent = new LazyHoloHashMap((author: AgentPubKey) =>
    lazyLoadAndPoll(async () => this.client.getMyResources(author), 4000)
  );

  /** My Booking Requests */

  myBookingRequests = pipe(
    lazyLoadAndPoll(async () => this.client.getMyBookingRequests(), 4000),
    hashes => sliceAndJoin(this.bookingRequests, hashes)
  );
}
