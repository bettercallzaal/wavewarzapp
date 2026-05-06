export interface ServerTimestamp {
  toMillis(): number;
  toDate(): Date;
}

export const fromDate = (d: Date): ServerTimestamp => ({
  toMillis: () => d.getTime(),
  toDate: () => d,
});

export const now = (): ServerTimestamp => fromDate(new Date());

export interface LiveState {
  isLive: boolean;
  currentBattleId: string | null;
  xSpaceUrl: string | null;
  scheduleNext: ServerTimestamp | null;
  updatedAt: ServerTimestamp;
  updatedBy: 'cron' | 'admin' | 'webhook' | 'demo';
}

export type BattleStatus = 'upcoming' | 'live' | 'settled';
export type BattleType = 'quick' | 'main' | 'benefit';

export interface Battle {
  id: string;
  artistAWallet: string;
  artistBWallet: string;
  artistAName: string;
  artistBName: string;
  songA: string | null;
  songB: string | null;
  poolASol: number;
  poolBSol: number;
  status: BattleStatus;
  type: BattleType;
  startedAt: ServerTimestamp | null;
  endedAt: ServerTimestamp | null;
  settledAt: ServerTimestamp | null;
  winner: 'a' | 'b' | null;
  joinUrl: string;
  cheerCountA?: number;
  cheerCountB?: number;
}

export type SpotlightTier = 'rising_star' | 'veteran' | 'legend';

export interface Artist {
  wallet: string;
  name: string;
  twitterHandle: string | null;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  winRatePercent: number;
  volumeSol: number;
  earningsSol: number;
  spotlightTier: SpotlightTier | null;
  lastBattleAt: ServerTimestamp | null;
}

export interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  text: string;
  createdAt: ServerTimestamp;
  deletedAt: ServerTimestamp | null;
}

export interface NotifPrefs {
  live: boolean;
  reminders: boolean;
  artistFollows: string[];
  quietHoursStartUtc: number | null;
  quietHoursEndUtc: number | null;
}

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  providerIds: string[];
  solanaWallet: string | null;
  fcmTokens: string[];
  notifPrefs: NotifPrefs;
  isWaveWarZArtist: boolean;
  createdAt: ServerTimestamp;
}
