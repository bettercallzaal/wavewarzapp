import { useEffect, useState } from 'react';
import type { Battle, BattleStatus } from '@/types/firestore';
import { subscribeToBattles } from '@/services/battles';

export const useBattles = (status: BattleStatus): Battle[] => {
  const [battles, setBattles] = useState<Battle[]>([]);
  useEffect(() => subscribeToBattles(status, setBattles), [status]);
  return battles;
};
