# WaveWarZ Live

A fan-facing companion app for [WaveWarZ](https://wavewarz.com) - the Solana prediction market for indie music battles.

The notification + spectator + chat layer that sits alongside `wavewarz.com` (the trade surface), `wavewarz-intelligence.vercel.app` (analytics + leaderboards), and `analytics-wave-warz.vercel.app` (charts).

> **Status:** Demo phase. UI complete, in-memory mock data. No real auth, no FCM, no Cloud Functions yet. See [demo limits](#demo-limits) below.

**Live web build:** https://wavewarzapp.vercel.app

## What it does

- Pushes you the second a session goes live (Mon-Fri 8:30PM EST X Spaces, Sun feature, ad-hoc)
- Shows the current battle: artists, songs, real-time SOL pool split, time elapsed
- One-tap "Join the Battle" deep link straight to wavewarz.com
- Town Square chat for fans waiting between battles
- Per-artist follow notifications (V1)
- Optional Phantom wallet connect (V1) - shows your battle stats if your wallet matches an artist record

Does not duplicate or compete with the trade app or Intelligence dashboard. The Join button is just a deep link, the leaderboard reads the same data Intelligence already exposes.

## Stack

- Expo SDK 52, React Native 0.76, TypeScript strict
- expo-router (file-based routing, typed routes)
- Tamagui design tokens (dark theme, electric purple accent)
- Zustand + React Query for state
- AsyncStorage for nickname persistence
- Phantom deeplink + tweetnacl for wallet sig verify (V1)
- Firebase native modules (auth, Firestore, FCM) - V1 only, not yet wired
- Cloud Functions for scrape / push fanout / webhook / admin (V1 only)

## Run locally

### Prereqs

- Node 20 or 22
- pnpm 9
- For native: Xcode 16 + iOS sim, or Android Studio + emulator

### Web (fastest, no native build needed)

```bash
pnpm install
pnpm exec expo start --web
```

Opens at `http://localhost:8081`. Same code that ships to native, served via Metro web bundler.

### iOS sim / Android emulator / phone

```bash
pnpm install
pnpm start
```

Then press `i` for iOS sim, `a` for Android emulator, or scan the QR with Expo Go on your phone.

Tamagui is native-module-free and AsyncStorage has a web polyfill, so demo phase runs everywhere with no dev build needed.

### Vercel deploy

`vercel.json` is wired. Pushing to `main` triggers auto-deploy. Output goes to `dist/` via `expo export --platform web` and serves as a SPA with index fallback so deep paths (`/battle/...`, `/artist/...`) resolve.

## Project structure

```
app/                          # expo-router routes
  _layout.tsx                 # root: Tamagui + React Query + fonts
  (tabs)/
    _layout.tsx               # bottom tabs (Live, Battles, Town Square, Profile)
    index.tsx                 # Live (hero, status, current battle, top 3 leaderboard, demo toggle)
    battles.tsx               # filterable list (live / upcoming / settled)
    chat.tsx                  # Town Square
    profile.tsx               # nickname, wallet placeholder, clear nickname
  battle/[id].tsx             # battle detail (artist cards, big pool ticker, winner card)
  artist/[wallet].tsx         # artist profile (avatar, tier badge, stats grid, follow toggle)
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
  specs/                      # full V1 design spec
  plans/                      # phase-by-phase implementation plan
```

The demo services in `src/services/` expose the same `subscribeTo*` shape Firestore listeners use, so swapping to real Firestore later is one file each.

## Demo limits

**What is real:**
- Full UI on iOS, Android, and web
- Real WaveWarZ artist roster (40 artists, real Solana wallets, real W-L records as of Mar 2026)
- Six demo battles (one live, two upcoming, three settled)
- Live state toggle on the Live screen flips LIVE/OFFLINE for testing
- Chat sends locally with rate limit (1 message per 3 seconds per device)
- Nickname persists via AsyncStorage
- Pool split bar, tier badges, animated status

**What is stubbed:**
- No real auth (Apple / Google / Email sign-in is in the spec, not yet wired)
- No FCM push (the demo toggle simulates the LIVE state change)
- No Cloud Functions (chat is local, doesn't sync across devices)
- No Phantom wallet connect (placeholder card in Profile)
- No real scraper - artist data is hardcoded from the Mar 2026 Intelligence dump
- No Sentry / Crashlytics

See [docs/superpowers/specs/2026-05-05-wavewarz-live-design.md](./docs/superpowers/specs/2026-05-05-wavewarz-live-design.md) for the full V1 design and [docs/superpowers/plans/2026-05-05-wavewarz-live.md](./docs/superpowers/plans/2026-05-05-wavewarz-live.md) for the phase-by-phase plan to swap each demo piece for the real backend.

## Open decisions for the team

Things to lock before V1 work resumes:

1. **Slot.** Standalone product alongside trade app + Intelligence + Analytics, or fold this functionality into Intelligence as a mobile build? Or scope smaller / kill?
2. **Data path.** Cleanest is a few `/api/v1/*` read endpoints on Intelligence + a webhook on `session.live` / `session.ended` / `battle.started` / `battle.settled`. Whoever owns Intelligence backend gets to decide where these land. Fallback is the app's own scraper Cloud Function (60s cron).
3. **Push events.** Four obvious ones (session live/ended, battle started/settled). Others worth waking the user for: pool shifted 20% in 60s, followed artist battling next, top trader threshold hit?
4. **Brand + naming.** Currently "WaveWarZ Live" with dark + electric purple. Keep, redo, or get a real designer pass on icon + splash?
5. **V1 wallet flow.** Phantom connect, verify sig, surface your battle stats if your wallet matches an artist record, claim deeplink to Intelligence's claim page. Ship V1 or hold for V2?
6. **V2 candidates - signal vs noise:**
   - Per-battle chat rooms (currently single global Town Square)
   - In-app audio preview from Audius for the songs in each battle
   - Free predict-the-winner game (points only, no SOL)
   - Cheer / vote counter (free social signal)
   - Auto-spotlight celebration cross-posted to @WaveWarZ when artists hit a tier
7. **Roster freshness.** The Mar Intelligence dump is missing Kata7yst, BennyJ504, DCoopOfficial. Need a way to keep `wavewarz_artists` fresh as new artists drop. Sync cron script lives in the spec but data source is TBD.

## Wiring real backend (V1)

The plan covers:

1. Create three Firebase projects (`wavewarzlive-{dev,staging,prod}`), upgrade to Blaze
2. Register iOS + Android apps, download `GoogleService-Info.plist` + `google-services.json`
3. Enable Apple, Google, Email link auth
4. Install RN Firebase native modules + run `expo prebuild`
5. Replace the in-memory services in `src/services/` with Firestore-backed versions
6. Deploy Cloud Functions (Intelligence sync or webhook receiver, FCM fanout, sendMessage callable, connectWallet callable, admin live-toggle)
7. Set up EAS Build for TestFlight + Play Internal Testing

Spec sections 4 + 5 + 7 + 8 cover the technical details. Plan phases 2 + 3 + 5 + 9 + 10 cover the work.

## Acknowledgments

Built as an internal companion to the WaveWarZ ecosystem. Backend data flows through [Intelligence](https://wavewarz-intelligence.vercel.app) ([CandyToyBox/wavewarz-intelligence](https://github.com/CandyToyBox/wavewarz-intelligence) on GitHub). Solana program work and the broader WaveWarZ stack are by Ikechi Nwachukwu ([@WaveWarZ](https://x.com/WaveWarZ)) and the team.

## License

All rights reserved.
