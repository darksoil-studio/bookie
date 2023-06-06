import { Booking } from './types';

import { BookingRequest } from './types';

import { Resource } from './types';

import { 
  AppAgentClient, 
  Record, 
  ActionHash, 
  EntryHash, 
  AgentPubKey,
} from '@holochain/client';
import { isSignalFromCellWithRole, EntryRecord, ZomeClient } from '@holochain-open-dev/utils';

import { BookieSignal } from './types.js';

export class BookieClient extends ZomeClient<BookieSignal> {
  constructor(public client: AppAgentClient, public roleName: string, public zomeName = 'bookie') {
    super(client, roleName, zomeName);
  }
  /** Resource */

  async createResource(resource: Resource): Promise<EntryRecord<Resource>> {
    const record: Record = await this.callZome('create_resource', resource);
    return new EntryRecord(record);
  }
  
  async getResource(resourceHash: ActionHash): Promise<EntryRecord<Resource> | undefined> {
    const record: Record = await this.callZome('get_resource', resourceHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteResource(originalResourceHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_resource', originalResourceHash);
  }

  async updateResource(originalResourceHash: ActionHash, previousResourceHash: ActionHash, updatedResource: Resource): Promise<EntryRecord<Resource>> {
    const record: Record = await this.callZome('update_resource', {
      original_resource_hash: originalResourceHash,
      previous_resource_hash: previousResourceHash,
      updated_resource: updatedResource
    });
    return new EntryRecord(record);
  }
  /** Booking Request */

  async createBookingRequest(bookingRequest: BookingRequest): Promise<EntryRecord<BookingRequest>> {
    const record: Record = await this.callZome('create_booking_request', bookingRequest);
    return new EntryRecord(record);
  }
  
  async getBookingRequest(bookingRequestHash: ActionHash): Promise<EntryRecord<BookingRequest> | undefined> {
    const record: Record = await this.callZome('get_booking_request', bookingRequestHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteBookingRequest(originalBookingRequestHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_booking_request', originalBookingRequestHash);
  }

  async updateBookingRequest(previousBookingRequestHash: ActionHash, updatedBookingRequest: BookingRequest): Promise<EntryRecord<BookingRequest>> {
    const record: Record = await this.callZome('update_booking_request', {
      previous_booking_request_hash: previousBookingRequestHash,
      updated_booking_request: updatedBookingRequest
    });
    return new EntryRecord(record);
  }
  
  async getBookingRequestsForResource(resourceHash: ActionHash): Promise<Array<EntryRecord<BookingRequest>>> {
    const records: Record[] = await this.callZome('get_booking_requests_for_resource', resourceHash);
    return records.map(r => new EntryRecord(r));
  }
  /** Booking */

  async createBooking(booking: Booking): Promise<EntryRecord<Booking>> {
    const record: Record = await this.callZome('create_booking', booking);
    return new EntryRecord(record);
  }
  
  async getBooking(bookingHash: ActionHash): Promise<EntryRecord<Booking> | undefined> {
    const record: Record = await this.callZome('get_booking', bookingHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteBooking(originalBookingHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_booking', originalBookingHash);
  }

  async updateBooking(previousBookingHash: ActionHash, updatedBooking: Booking): Promise<EntryRecord<Booking>> {
    const record: Record = await this.callZome('update_booking', {
      previous_booking_hash: previousBookingHash,
      updated_booking: updatedBooking
    });
    return new EntryRecord(record);
  }
  
  async getBookingsForBookingRequest(bookingRequestHash: ActionHash): Promise<Array<EntryRecord<Booking>>> {
    const records: Record[] = await this.callZome('get_bookings_for_booking_request', bookingRequestHash);
    return records.map(r => new EntryRecord(r));
  }

  async getBookingsForResource(resourceHash: ActionHash): Promise<Array<EntryRecord<Booking>>> {
    const records: Record[] = await this.callZome('get_bookings_for_resource', resourceHash);
    return records.map(r => new EntryRecord(r));
  }

  /** All Resources */

  async getAllResources(): Promise<Array<EntryRecord<Resource>>> {
    const records: Record[] = await this.callZome('get_all_resources', null);
    return records.map(r => new EntryRecord(r));
  }

  /** My Resources */

  async getMyResources(author: AgentPubKey): Promise<Array<EntryRecord<Resource>>> {
    const records: Record[] = await this.callZome('get_my_resources', author);
    return records.map(r => new EntryRecord(r));
  }

  /** My Booking Requests */

  async getMyBookingRequests(author: AgentPubKey): Promise<Array<EntryRecord<BookingRequest>>> {
    const records: Record[] = await this.callZome('get_my_booking_requests', author);
    return records.map(r => new EntryRecord(r));
  }

}