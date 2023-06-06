import {
  DnaHash,
  Record, 
  ActionHash, 
  SignedActionHashed,
  EntryHash, 
  AgentPubKey,
  Create,
  Update,
  Delete,
  CreateLink,
  DeleteLink
} from '@holochain/client';

export type BookieSignal = {
  type: 'EntryCreated';
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: 'EntryUpdated';
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: 'EntryDeleted';
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: 'LinkCreated';
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: 'LinkDeleted';
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

export type EntryTypes =
 | ({ type: 'Booking'; } & Booking)
 | ({ type: 'BookingRequest'; } & BookingRequest)
 | ({  type: 'Resource'; } & Resource);



export interface Resource { 
  name: string;

  description: string;

  image_hash: EntryHash;
}




export interface BookingRequest { 
  resource_hash: ActionHash;

  title: string;

  comment: string;

  start_time: number;

  end_time: number;
}




export interface Booking { 
  title: string;

  start_time: number;

  end_time: number;

  booking_request_hash: ActionHash | undefined;

  resource_hash: ActionHash;
}

