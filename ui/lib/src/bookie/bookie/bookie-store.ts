import { Booking } from './types';

import { BookingRequest } from './types';

import { Resource } from './types';

import { lazyLoadAndPoll, AsyncReadable } from "@holochain-open-dev/stores";
import { EntryRecord, LazyHoloHashMap } from "@holochain-open-dev/utils";
import { NewEntryAction, Record, ActionHash, EntryHash, AgentPubKey } from '@holochain/client';

import { BookieClient } from './bookie-client.js';

export class BookieStore {
  constructor(public client: BookieClient) {}
  
  /** Resource */

  resources = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getResource(resourceHash), 4000)
  );
  
  /** Booking Request */

  bookingRequests = new LazyHoloHashMap((bookingRequestHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getBookingRequest(bookingRequestHash), 4000)
  );

  bookingRequestsForResource = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => {
        const records = await this.client.getBookingRequestsForResource(resourceHash);
        return records.map(r => r.actionHash);
      },
      4000
    )
  );
  
  /** Booking */

  bookings = new LazyHoloHashMap((bookingHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getBooking(bookingHash), 4000)
  );

  bookingsForBookingRequest = new LazyHoloHashMap((bookingRequestHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => {
        const records = await this.client.getBookingsForBookingRequest(bookingRequestHash);
        return records.map(r => r.actionHash);
      },
      4000
    )
  );

  bookingsForResource = new LazyHoloHashMap((resourceHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => {
        const records = await this.client.getBookingsForResource(resourceHash);
        return records.map(r => r.actionHash);
      },
      4000
    )
  );
  
  /** All Resources */

  allResources = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllResources();
    return records.map(r => r.actionHash);
  }, 4000);
  
  /** My Resources */

  myResources = new LazyHoloHashMap((author: AgentPubKey) => 
    lazyLoadAndPoll(async () => {
      const records = await this.client.getMyResources(author);
      return records.map(r => r.actionHash);
    }, 4000)
  );
  
  /** My Booking Requests */

  myBookingRequests = new LazyHoloHashMap((author: AgentPubKey) => 
    lazyLoadAndPoll(async () => {
      const records = await this.client.getMyBookingRequests(author);
      return records.map(r => r.actionHash);
    }, 4000)
  );
}
