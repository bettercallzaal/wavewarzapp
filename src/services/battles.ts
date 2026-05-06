import type { Battle, BattleStatus } from '@/types/firestore';
import { createEmitter, type Unsubscribe } from '@/lib/emitter';
import { mockBattles } from '@/data/mockBattles';

const emitter = createEmitter<Battle[]>(mockBattles);

const orderForStatus = (status: BattleStatus, list: Battle[]): Battle[] => {
  if (status === 'settled') {
    return [...list].sort((a, b) => (b.settledAt?.toMillis() ?? 0) - (a.settledAt?.toMillis() ?? 0));
  }
  return [...list].sort(
    (a, b) => (a.startedAt?.toMillis() ?? 0) - (b.startedAt?.toMillis() ?? 0),
  );
};

export const subscribeToBattles = (
  status: BattleStatus,
  listener: (battles: Battle[]) => void,
): Unsubscribe =>
  emitter.subscribe((list) => listener(orderForStatus(status, list.filter((b) => b.status === status))));

export const subscribeToBattle = (
  id: string,
  listener: (battle: Battle | null) => void,
): Unsubscribe => emitter.subscribe((list) => listener(list.find((b) => b.id === id) ?? null));

export const getBattle = (id: string): Battle | null =>
  emitter.get().find((b) => b.id === id) ?? null;

export const updateBattleDemo = (id: string, patch: Partial<Battle>): void => {
  emitter.set((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
};
