import { useEffect, useState } from 'react';
import type { LiveState } from '@/types/firestore';
import { subscribeToLiveState, getLiveState } from '@/services/liveState';

export const useLiveState = (): LiveState => {
  const [state, setState] = useState<LiveState>(getLiveState());
  useEffect(() => subscribeToLiveState(setState), []);
  return state;
};
