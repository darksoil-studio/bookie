import { EntryRecord } from '@holochain-open-dev/utils';
import { encodeHashToBase64 } from '@holochain/client';
import { Booking, BookingRequest, Resource } from './types';

export interface Event {
  id: string;
  resourceIds: string[];
  allDay: boolean;
  start: Date;
  end: Date;
  title: string;
  editable: boolean | undefined;
  startEditable: boolean | undefined;
  durationEditable: boolean | undefined;
  display: 'auto' | 'background';
  backgroundColor?: string;
  textColor?: string;
  extendedProps: any;
}

export function conflictingTimeSlots(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

export function bookingToCalendarEvent(booking: EntryRecord<Booking>): Event {
  return {
    id: encodeHashToBase64(booking.actionHash),
    allDay: false,
    resourceIds: [encodeHashToBase64(booking.entry.resource_hash)],
    title: booking.entry.title,
    extendedProps: {},
    display: 'auto',
    durationEditable: false,
    editable: false,
    startEditable: false,
    start: new Date(Math.floor(booking.entry.start_time / 1000)),
    end: new Date(Math.floor(booking.entry.end_time / 1000)),
  };
}

export function bookingRequestToCalendarEvent(
  bookingRequest: EntryRecord<BookingRequest>
): Event {
  return {
    backgroundColor: 'white',
    textColor: 'var(--sl-color-primary-900)',
    id: encodeHashToBase64(bookingRequest.actionHash),
    allDay: false,
    title: `[REQUEST] ${bookingRequest.entry.title}`,
    extendedProps: {},
    display: 'auto',
    resourceIds: [encodeHashToBase64(bookingRequest.entry.resource_hash)],
    durationEditable: false,
    editable: false,
    startEditable: false,
    start: new Date(Math.floor(bookingRequest.entry.start_time / 1000)),
    end: new Date(Math.floor(bookingRequest.entry.end_time / 1000)),
  };
}

export interface EventCalendarResource {
  id: string;
  title: string;
}

export function resourceToEventCalendarResource(
  resource: EntryRecord<Resource>
): EventCalendarResource {
  return {
    id: encodeHashToBase64(resource.actionHash),
    title: resource.entry.name,
  };
}
