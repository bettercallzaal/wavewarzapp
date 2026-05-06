import { useEffect, useState } from 'react';
import type { Battle } from '@/types/firestore';
import { subscribeToBattle, getBattle } from '@/services/battles';

export const useBattle = (id: string | null): Battle | null => {
  const [battle, setBattle] = useState<Battle | null>(id ? getBattle(id) : null);
  useEffect(() => {
    if (!id) {
      setBattle(null);
      return;
    }
    return subscribeToBattle(id, setBattle);
  }, [id]);
  return battle;
};
