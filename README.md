# WaveWarZ Live

Real-time alert + spectator app for [WaveWarZ](https://wavewarz.com) - the Solana prediction market for indie music battles.

> **Status:** Demo phase. UI complete, in-memory mock data. No real auth, no FCM, no Cloud Functions yet. See [demo limits](#demo-limits) below.

**Live web build:** https://wavewarzapp.vercel.app

## What it does

- Pushes you the moment a WaveWarZ session goes live (Mon-Fri 8:30PM EST X Spaces, Sun feature, ad-hoc)
- Shows the current battle: artists, songs, real-time SOL pool split, time elapsed
- One-tap "Join the Battle" link to wavewarz.com
- Town Square chat for fans waiting between battles
- Per-artist follow notifications
- Optional Phantom wallet connect (V1 - shows your stats if you are a battling artist)

## Stack

- Expo SDK 52, React Native 0.76, TypeScript strict
- expo-router (file-based routing, typed routes)
- Tamagui design tokens
- Zustand + React Query for state
- AsyncStorage for nickname persistence
- Phantom deeplink + tweetnacl for wallet sig verify (V1)
- Firebase native modules (auth, Firestore, FCM) - V1 only, not yet wired
- Cloud Functions for scrape, push fanout, webhook, admin (V1 only)

## Run

### Prereqs

- Node 20 or 22
- pnpm 9
- For native: Xcode 16 + iOS sim, or Android Studio + emulator

### Web (no native build needed)

```bash
pnpm install
pnpm exec expo start --web
```

Opens at `http://localhost:8081`. Same code that ships to native, just served via Metro web bundler.

### iOS sim / Android emulator

```bash
pnpm install
pnpm start
```

Then press `i` for iOS sim, `a` for Android emulator. Or scan QR with Expo Go on your phone.

Tamagui is native-module-free and AsyncStorage has a web polyfill, so demo phase runs everywhere with no dev build needed.

### Build for Vercel (web preview)

`vercel.json` is wired. Push to `main` triggers auto-deploy. Output goes to `dist/` via `expo export --platform web` and serves as a SPA with index fallback.

## Project structure

```
app/                          # expo-router routes
  _layout.tsx                 # root: Tamagui + React Query + fonts
  (tabs)/
    _layout.tsx               # bottom tabs (Live, Battles, Town Square, Profile)
    index.tsx                 # Live (hero, status, current battle, top 3)
    battles.tsx               # filterable list (live / upcoming / settled)
    chat.tsx                  # Town Square
    profile.tsx               # nickname, wallet placeholder, sign out
  battle/[id].tsx             # battle detail
  artist/[wallet].tsx         # artist profile
src/
  components/                 # StatusCard, BattleCard, PoolBar, ArtistAvatar, ChatBubble, PrimaryButton
  hooks/                      # useLiveState, useBattles, useBattle, useArtist(s), useChatMessages
  services/                   # liveState, battles, artists, chat (in-memory demo backends)
  data/                       # mockArtists (real WaveWarZ roster from Mar 2026), mockBattles, mockChat
  lib/                        # emitter, identity, queryClient
  stores/                     # useIdentity (Zustand)
  theme/                      # tokens.ts (palette, spacing, radii, fontSize)
  types/firestore.ts          # shared shape between demo + future real Firestore
  config/env.ts               # env loader (Firebase keys optional in demo phase)
docs/superpowers/
  specs/                      # design spec (V1 architecture)
  plans/                      # bite-sized implementation plan
```

The demo services in `src/services/` expose the same `subscribeTo*` shape Firestore listeners use, so swapping to real Firestore later is one file each.

## Demo limits

What is real:
- Full UI on iOS, Android, and web
- Real WaveWarZ artist roster (40 artists, real Solana wallets, real W-L records as of Mar 2026)
- Six demo battles (one live, two upcoming, three settled)
- Live state toggle on the Live screen lets you flip LIVE/OFFLINE
- Chat sends locally with rate limit (1 message per 3 seconds per device)
- Nickname persists via AsyncStorage

What is stubbed:
- No real auth (no Apple/Google/Email sign-in yet)
- No FCM push (the demo toggle simulates the LIVE state change)
- No Cloud Functions (chat does not sync between devices)
- No Phantom wallet connect (placeholder card in Profile)
- No real scraper - artist data is hardcoded from research
- No Sentry / Crashlytics

See [docs/superpowers/specs/2026-05-05-wavewarz-live-design.md](./docs/superpowers/specs/2026-05-05-wavewarz-live-design.md) for the full V1 design and [docs/superpowers/plans/2026-05-05-wavewarz-live.md](./docs/superpowers/plans/2026-05-05-wavewarz-live.md) for the phase-by-phase plan to swap each demo piece for the real backend.

## Wiring real backend (V1)

When you are ready, the plan covers:

1. Create three Firebase projects (`wavewarzlive-{dev,staging,prod}`), upgrade to Blaze
2. Register iOS + Android apps, download `GoogleService-Info.plist` + `google-services.json`
3. Enable Apple, Google, Email link auth
4. Install RN Firebase native modules + run `expo prebuild`
5. Replace the in-memory services in `src/services/` with Firestore-backed versions
6. Deploy Cloud Functions (scrape Intelligence, FCM fanout, webhook, admin callable)
7. Set up EAS Build for TestFlight + Play Internal Testing

Spec sections 4 + 5 + 7 + 8 cover the technical details. Plan phases 2 + 3 + 5 + 9 + 10 cover the work.

## Acknowledgments

WaveWarZ is built and operated by [Ikechi Nwachukwu (Hurric4n3Ike)](https://x.com/WaveWarZ). This companion app is sanctioned by Hurricane and consumes data from [wavewarz-intelligence.vercel.app](https://wavewarz-intelligence.vercel.app) (CandyToyBox/wavewarz-intelligence on GitHub).

## License

All rights reserved.
