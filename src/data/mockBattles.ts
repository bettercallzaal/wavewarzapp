import type { Battle } from '@/types/firestore';
import { fromDate } from '@/types/firestore';
import { mockArtists } from './mockArtists';

const findArtist = (name: string) => {
  const a = mockArtists.find((x) => x.name === name);
  if (!a) throw new Error(`mock artist not found: ${name}`);
  return a;
};

const buildBattle = (params: {
  id: string;
  aName: string;
  bName: string;
  songA: string;
  songB: string;
  status: Battle['status'];
  type: Battle['type'];
  poolASol: number;
  poolBSol: number;
  startedMinutesAgo: number;
  durationMinutes: number;
  winner: Battle['winner'];
}): Battle => {
  const a = findArtist(params.aName);
  const b = findArtist(params.bName);
  const startedAt = fromDate(new Date(Date.now() - params.startedMinutesAgo * 60_000));
  const endedAt =
    params.status === 'settled'
      ? fromDate(
          new Date(Date.now() - (params.startedMinutesAgo - params.durationMinutes) * 60_000),
        )
      : null;

  return {
    id: params.id,
    artistAWallet: a.wallet,
    artistBWallet: b.wallet,
    artistAName: a.name,
    artistBName: b.name,
    songA: params.songA,
    songB: params.songB,
    poolASol: params.poolASol,
    poolBSol: params.poolBSol,
    status: params.status,
    type: params.type,
    startedAt,
    endedAt,
    settledAt: params.status === 'settled' ? endedAt : null,
    winner: params.winner,
    joinUrl: `https://wavewarz.com/battle/${params.id}`,
    cheerCountA: 0,
    cheerCountB: 0,
  };
};

export const mockBattles: Battle[] = [
  buildBattle({
    id: 'demo-live-1',
    aName: 'LUI',
    bName: 'APORKALYPSE',
    songA: 'Dale Vuelta 360',
    songB: 'Pork Anthem',
    status: 'live',
    type: 'main',
    poolASol: 0.84,
    poolBSol: 0.61,
    startedMinutesAgo: 7,
    durationMinutes: 0,
    winner: null,
  }),
  buildBattle({
    id: 'demo-up-1',
    aName: 'Hurric4n3Ike',
    bName: 'STILO English',
    songA: 'Wave Theory',
    songB: 'Suspekt Stilo',
    status: 'upcoming',
    type: 'main',
    poolASol: 0,
    poolBSol: 0,
    startedMinutesAgo: -25,
    durationMinutes: 0,
    winner: null,
  }),
  buildBattle({
    id: 'demo-up-2',
    aName: 'PROF!T',
    bName: 'JED XO',
    songA: 'High Volume',
    songB: 'Undefeated',
    status: 'upcoming',
    type: 'quick',
    poolASol: 0,
    poolBSol: 0,
    startedMinutesAgo: -45,
    durationMinutes: 0,
    winner: null,
  }),
  buildBattle({
    id: 'demo-set-1',
    aName: 'Stormi',
    bName: 'ONE',
    songA: 'Eye of the Storm',
    songB: 'One Take',
    status: 'settled',
    type: 'quick',
    poolASol: 0.42,
    poolBSol: 0.31,
    startedMinutesAgo: 120,
    durationMinutes: 12,
    winner: 'a',
  }),
  buildBattle({
    id: 'demo-set-2',
    aName: 'Krem',
    bName: 'Goose Park',
    songA: 'Smooth Lane',
    songB: 'Park Life',
    status: 'settled',
    type: 'quick',
    poolASol: 0.18,
    poolBSol: 0.27,
    startedMinutesAgo: 180,
    durationMinutes: 11,
    winner: 'b',
  }),
  buildBattle({
    id: 'demo-set-3',
    aName: 'Money Miller',
    bName: 'GODCLOUD',
    songA: 'Bag Talk',
    songB: 'Cloud Walk',
    status: 'settled',
    type: 'main',
    poolASol: 0.55,
    poolBSol: 0.44,
    startedMinutesAgo: 1440,
    durationMinutes: 18,
    winner: 'a',
  }),
];
