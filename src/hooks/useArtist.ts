import { useEffect, useState } from 'react';
import type { Artist } from '@/types/firestore';
import { subscribeToArtist, getArtist } from '@/services/artists';

export const useArtist = (wallet: string | null): Artist | null => {
  const [artist, setArtist] = useState<Artist | null>(wallet ? getArtist(wallet) : null);
  useEffect(() => {
    if (!wallet) {
      setArtist(null);
      return;
    }
    return subscribeToArtist(wallet, setArtist);
  }, [wallet]);
  return artist;
};
