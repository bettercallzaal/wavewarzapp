import { useEffect, useState } from 'react';
import type { Artist } from '@/types/firestore';
import { subscribeToArtists } from '@/services/artists';

export const useArtists = (): Artist[] => {
  const [artists, setArtists] = useState<Artist[]>([]);
  useEffect(() => subscribeToArtists(setArtists), []);
  return artists;
};
