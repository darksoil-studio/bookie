import { createContext } from '@lit-labs/context';
import { BookieStore } from './bookie-store';

export const bookieStoreContext = createContext<BookieStore>(
  'hc_zome_bookie/store'
);

