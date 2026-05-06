import type { LiveState, ServerTimestamp } from '@/types/firestore';
import { now, fromDate } from '@/types/firestore';
import { createEmitter, type Unsubscribe } from '@/lib/emitter';

const nextScheduled = (): ServerTimestamp => {
  const next = new Date();
  next.setHours(20, 30, 0, 0);
  if (next.getTime() < Date.now()) next.setDate(next.getDate() + 1);
  return fromDate(next);
};

const initial: LiveState = {
  isLive: true,
  currentBattleId: 'demo-live-1',
  xSpaceUrl: 'https://x.com/i/spaces/demo',
  scheduleNext: nextScheduled(),
  updatedAt: now(),
  updatedBy: 'demo',
};

const emitter = createEmitter<LiveState>(initial);

export const subscribeToLiveState = (listener: (state: LiveState) => void): Unsubscribe =>
  emitter.subscribe(listener);

export const getLiveState = (): LiveState => emitter.get();

export const setLiveStateDemo = (patch: Partial<LiveState>): void => {
  emitter.set((prev) => ({
    ...prev,
    ...patch,
    updatedAt: now(),
    updatedBy: 'demo',
  }));
};
