import type { Artist } from '@/types/firestore';

const winRate = (w: number, l: number): number => {
  const total = w + l;
  return total === 0 ? 0 : Math.round((w / total) * 1000) / 10;
};

const tier = (wins: number): Artist['spotlightTier'] => {
  if (wins >= 25) return 'legend';
  if (wins >= 10) return 'veteran';
  if (wins >= 3) return 'rising_star';
  return null;
};

interface ArtistSeed {
  wallet: string;
  name: string;
  twitterHandle: string | null;
  wins: number;
  losses: number;
  volumeSol: number;
  earningsSol: number;
}

const seeds: ArtistSeed[] = [
  { wallet: 'B97zbRCUf2jhPj6Cs2QXc9EGyWdNDvQ6ExUeB7sxrTSA', name: 'LUI', twitterHandle: 'luijoseph_', wins: 49, losses: 22, volumeSol: 29.5888, earningsSol: 0.528 },
  { wallet: '62g5hYiSTqj185F26c3pT6EPx4Gs1P6gL72kGNzvkbjM', name: 'Hurric4n3Ike', twitterHandle: 'hurric4n3ike', wins: 60, losses: 18, volumeSol: 3.6081, earningsSol: 0.0836 },
  { wallet: '2J32aabxSnAPC4YpTC6jFX6EMPRkHeovPuMNtfLs8bXp', name: 'Stormi', twitterHandle: null, wins: 31, losses: 44, volumeSol: 11.8671, earningsSol: 0.2195 },
  { wallet: 'CUh7ZWej4qG4daKHA44vV7zNNeonyctt45qHZykz9WGN', name: 'APORKALYPSE', twitterHandle: 'Aporkalypse504', wins: 22, losses: 8, volumeSol: 10.9753, earningsSol: 0.2223 },
  { wallet: 'F4HRLiYo8uk9uuF9PV23czSHRy38sgj9uPBJdx4dmZnP', name: 'Lil Rocky', twitterHandle: null, wins: 10, losses: 23, volumeSol: 11.9572, earningsSol: 0.1771 },
  { wallet: '9HMK1zVyNJhnqtgog9knwrjHtqeX6N2fjcvojfw7y2WZ', name: 'ONE', twitterHandle: null, wins: 9, losses: 5, volumeSol: 12.0425, earningsSol: 0.2057 },
  { wallet: 'F9U1Q12LtVRadwMud97Mm6K4YCBSrEgS7ZBd9vMTB1t8', name: 'Yoshiro Mare', twitterHandle: null, wins: 6, losses: 4, volumeSol: 5.723, earningsSol: 0.1056 },
  { wallet: '9xTn9ni1UPACiB1KQy6U8gd33nzM86BP3REje9gyBZmx', name: 'GODCLOUD', twitterHandle: null, wins: 6, losses: 13, volumeSol: 6.6788, earningsSol: 0.0846 },
  { wallet: 'BFM9h9WMxGCYxqexLB5w93iSd5uye9xCyxkjchZirG4X', name: 'PROF!T', twitterHandle: null, wins: 5, losses: 2, volumeSol: 13.8564, earningsSol: 0.2025 },
  { wallet: '23oqJnEJhJ3qLTq5MjKYPgLDYjfpRmvWWzMA3Zq6NGmg', name: 'Geek Myth', twitterHandle: null, wins: 5, losses: 5, volumeSol: 5.7748, earningsSol: 0.0838 },
  { wallet: 'j2wHMZUPNrAuj1yoGtuE47pUcQQ4EvASnkWrS1kD6hs', name: 'Money Miller', twitterHandle: null, wins: 5, losses: 6, volumeSol: 6.1981, earningsSol: 0.0856 },
  { wallet: '9LLTjsWhYJBxFgca43MQtrLLsPcxWMR86NoxAHGsBUCk', name: 'STILO English', twitterHandle: 'stilosd', wins: 4, losses: 5, volumeSol: 14.4637, earningsSol: 0.2394 },
  { wallet: 'Dtoezry5LGFEx63AaGJyWBgn5GbobTmKZ4SrX9v6BmF4', name: 'Crypto Beat Radio', twitterHandle: null, wins: 4, losses: 4, volumeSol: 4.7521, earningsSol: 0.061 },
  { wallet: 'Bf75J5XaGQkqC7ndhNWrkhWfqJnJrLrHKa3dhr2Nh3Pe', name: 'CHECK', twitterHandle: null, wins: 4, losses: 4, volumeSol: 1.3833, earningsSol: 0.021 },
  { wallet: 'AmDkgFg1dbLeGppfou612eeoygbRjuXZ1Kv5hfynSurs', name: 'JED XO', twitterHandle: null, wins: 3, losses: 0, volumeSol: 1.6496, earningsSol: 0.0488 },
  { wallet: 'CWvdGzpNbUDRJaUVGVwFnyMCwnLikfYqA45KGgWpC5NM', name: 'Krem', twitterHandle: null, wins: 3, losses: 2, volumeSol: 8.8442, earningsSol: 0.1259 },
  { wallet: '7v6RxAhGZd6MzvCZ9gxsw5t4iHaGUmG7mn4cSzSLSChu', name: 'K1DDV3NOM', twitterHandle: null, wins: 3, losses: 3, volumeSol: 5.3697, earningsSol: 0.0717 },
  { wallet: '9rgpHm4iSXjdN9Psarw5Lz8ftqVcV5CnE1xjrYFhz1gW', name: 'Dr. Bruce Banner', twitterHandle: null, wins: 1, losses: 2, volumeSol: 1.8685, earningsSol: 0.0271 },
  { wallet: 'F11aszq1b1p3QvuYzmJXMwFMFYw7bxTbeQ42PfQyCzNE', name: 'Goose Park', twitterHandle: null, wins: 3, losses: 2, volumeSol: 3.1029, earningsSol: 0.041 },
  { wallet: '2tbquBjgrCUbsxTbCHYJM1BSc3MZD3W1HXGmD5y4R8tU', name: 'MOZAY CALLOWAY', twitterHandle: null, wins: 3, losses: 5, volumeSol: 2.1329, earningsSol: 0.0269 },
  { wallet: '3vEb4ECM4tqfG1CLrdXqgA56KA4UcuWx9mw7puiWWQKG', name: 'Ramone', twitterHandle: null, wins: 2, losses: 2, volumeSol: 2.4231, earningsSol: 0.0432 },
  { wallet: 'EB6NHP31B8hM1f4zwzKVNUD66t3CYLfse6HhD9fim1wg', name: 'BallOutCut', twitterHandle: null, wins: 2, losses: 1, volumeSol: 2.0328, earningsSol: 0.0362 },
  { wallet: 'EsZTCLNnTzvma5rJArHvQsuoUtxoRiZTuTgng3nNxW6s', name: 'CANNON', twitterHandle: null, wins: 2, losses: 3, volumeSol: 1.3466, earningsSol: 0.0149 },
  { wallet: 'CnzrNEu9JFS95fsbMGvkbNLzEKbDazQ6RiTXkrwbbBZw', name: 'CANNON JONES', twitterHandle: null, wins: 2, losses: 2, volumeSol: 5.012, earningsSol: 0.1057 },
  { wallet: 'CcXSb6iaUFZwsrMFw2htXYdVDqxPTtn4EkoyJ78XLtys', name: 'Chief', twitterHandle: null, wins: 2, losses: 1, volumeSol: 4.7359, earningsSol: 0.0918 },
  { wallet: '9xMBJbs3xZ1CwpR75U7b4vpTD3ou3HbVzuHiLRE21Jgo', name: '$BONGA: VibeLord', twitterHandle: null, wins: 2, losses: 1, volumeSol: 3.6638, earningsSol: 0.0504 },
  { wallet: 'BFjm3Cocn1gdqRe9kA9k1Wf5P5ffPtohLttpqdyAhFBb', name: 'Armand', twitterHandle: null, wins: 2, losses: 2, volumeSol: 4.199, earningsSol: 0.0892 },
  { wallet: 'Bx1o7mkirgPigHwAxVQaypoRHtL6JNdLHmcrzpfyk12f', name: 'Chill Sample Hub', twitterHandle: null, wins: 2, losses: 1, volumeSol: 0.5675, earningsSol: 0.0096 },
  { wallet: '7a6BrTcHq21CNgY6okuYyCJczTctJnqv1zUSRAjNqNAJ', name: 'Rome', twitterHandle: null, wins: 2, losses: 1, volumeSol: 5.1686, earningsSol: 0.0902 },
  { wallet: '7gR78C7mq5Bg1iFBht7kxx8F88Gpx8oy3P3y7BQeeGYz', name: 'Preshzino Songz', twitterHandle: null, wins: 2, losses: 1, volumeSol: 9.5625, earningsSol: 0.1534 },
  { wallet: '59x5Y37hR6LbFSLWKitY47H4LvnakVet6hVobm6c7anx', name: 'JayStreetz', twitterHandle: null, wins: 2, losses: 1, volumeSol: 1.0982, earningsSol: 0.0146 },
  { wallet: '8qXrvREdA1whuqmLiuW7h9ZhiRCrkWpZqKUs97ss68M1', name: 'The Tech', twitterHandle: null, wins: 2, losses: 4, volumeSol: 5.6735, earningsSol: 0.0794 },
  { wallet: '4LyAbTzpEPo21tN9rNazkU5VmkNdPBJ7HttiAT2CuB8S', name: 'LexiBanti', twitterHandle: null, wins: 1, losses: 2, volumeSol: 7.5495, earningsSol: 0.1161 },
  { wallet: 'EMXDPJp9jTaDnSdzvwzpA5zdfgbf74mwjNQc5ZAmCSNA', name: 'Visionz', twitterHandle: null, wins: 1, losses: 2, volumeSol: 4.6294, earningsSol: 0.0677 },
  { wallet: 'G7oRakt851BoY5HVQM7ryP8fma3LkSVHiavyQFbuQY66', name: 'Wiz', twitterHandle: null, wins: 1, losses: 2, volumeSol: 4.3085, earningsSol: 0.078 },
  { wallet: '3upVJtamyVx9h8zseHhGDHbtqZ7n15wUh6SzNJR2GFN4', name: 'PKMN CTO', twitterHandle: null, wins: 1, losses: 2, volumeSol: 0.9424, earningsSol: 0.0151 },
  { wallet: 'Ciu7T1FhAthTBMC7dN7KQKyRGAr2BpPg5Snq6YxBsxSm', name: '$STUPID: Atchblockbaby', twitterHandle: null, wins: 1, losses: 2, volumeSol: 3.5521, earningsSol: 0.0435 },
  { wallet: '3FXptfW8c1w9CQk6FRAK97vVHBPisABdHvVr2DJAurwR', name: 'Davyd', twitterHandle: null, wins: 0, losses: 3, volumeSol: 2.3648, earningsSol: 0.0329 },
  { wallet: '13gQxwput7SSr7BQSxPiRvW45Q81KtKZikzWw4A75fkc', name: 'AYOTEMI', twitterHandle: null, wins: 0, losses: 3, volumeSol: 1.3377, earningsSol: 0.0263 },
  { wallet: 'Cx5HiWEw8m87HMPV7zcis65y6KEtFV47h8sBnhsefaYD', name: 'GESD1', twitterHandle: null, wins: 1, losses: 2, volumeSol: 0.2245, earningsSol: 0.0058 },
];

export const mockArtists: Artist[] = seeds.map((s) => ({
  wallet: s.wallet,
  name: s.name,
  twitterHandle: s.twitterHandle,
  avatarUrl: null,
  wins: s.wins,
  losses: s.losses,
  winRatePercent: winRate(s.wins, s.losses),
  volumeSol: s.volumeSol,
  earningsSol: s.earningsSol,
  spotlightTier: tier(s.wins),
  lastBattleAt: null,
}));
