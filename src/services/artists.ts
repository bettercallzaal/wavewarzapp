import type { Artist } from '@/types/firestore';
import { createEmitter, type Unsubscribe } from '@/lib/emitter';
import { mockArtists } from '@/data/mockArtists';

const emitter = createEmitter<Artist[]>(mockArtists);

export const subscribeToArtists = (listener: (artists: Artist[]) => void): Unsubscribe =>
  emitter.subscribe((list) => listener([...list].sort((a, b) => b.wins - a.wins)));

export const subscribeToArtist = (
  wallet: string,
  listener: (artist: Artist | null) => void,
): Unsubscribe =>
  emitter.subscribe((list) => listener(list.find((a) => a.wallet === wallet) ?? null));

export const getArtist = (wallet: string): Artist | null =>
  emitter.get().find((a) => a.wallet === wallet) ?? null;
