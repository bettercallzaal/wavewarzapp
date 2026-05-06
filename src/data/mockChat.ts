import type { ChatMessage } from '@/types/firestore';
import { fromDate } from '@/types/firestore';

const mins = (m: number) => fromDate(new Date(Date.now() - m * 60_000));

export const mockChat: ChatMessage[] = [
  {
    id: 'm1',
    uid: 'u-tape',
    displayName: 'TapeRider',
    text: 'Waiting on the next bell. Anyone else here for the LUI main event?',
    createdAt: mins(8),
    deletedAt: null,
  },
  {
    id: 'm2',
    uid: 'u-scout',
    displayName: 'WaveScout',
    text: 'Notifications on. Not missing this one.',
    createdAt: mins(6),
    deletedAt: null,
  },
  {
    id: 'm3',
    uid: 'u-flux',
    displayName: 'FluxCapacitor',
    text: 'STILO has been quiet, due for a comeback main event soon.',
    createdAt: mins(3),
    deletedAt: null,
  },
  {
    id: 'm4',
    uid: 'u-bag',
    displayName: 'BagRunner',
    text: 'Pool keeps shifting. APORKALYPSE pulled back to 42% just now.',
    createdAt: mins(1),
    deletedAt: null,
  },
];
