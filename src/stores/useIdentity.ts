import { create } from 'zustand';
import { loadIdentity, saveNickname } from '@/lib/identity';

interface State {
  uid: string | null;
  nickname: string | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

export const useIdentity = create<State>((set) => ({
  uid: null,
  nickname: null,
  loading: true,
  bootstrap: async () => {
    const { uid, nickname } = await loadIdentity();
    set({ uid, nickname, loading: false });
  },
  setNickname: async (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    await saveNickname(trimmed);
    set({ nickname: trimmed });
  },
}));
