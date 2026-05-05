# WaveWarZ Live - Design Spec

**Status:** Approved by Zaal, awaiting written-spec review
**Date:** 2026-05-05
**Author:** Claude (Opus 4.7) with Zaal
**Project root:** `/Users/zaalpanthaki/Documents/wwapp`
**Scope:** V1 ship - mobile alert + spectator app for WaveWarZ live music trading battles

---

## 1. Goal

Ship a cross-platform iOS + Android app that:

1. Pushes a real, time-sensitive alert the second a WaveWarZ battle session goes live (Mon-Fri 8:30PM EST X Spaces, Sun feature, ad-hoc).
2. Surfaces the live battle (artists, songs, SOL pool split, X Space link) and a deep "Join on wavewarz.com" path with one tap.
3. Provides a Town Square chat so fans coordinate while waiting and during sessions.
4. Optionally connects a Solana (Phantom) wallet so a fan who is also a WaveWarZ artist sees their own stats and a claim affordance.

The app is officially sanctioned by Hurric4n3Ike (founder, @WaveWarZ on X). Hurricane will build any backend endpoints we need.

## 2. Context

WaveWarZ is a Solana-based prediction market for indie hip-hop / R&B music battles. Two artists or songs are matched, fans deposit SOL into the pool they predict will win via Battle Vault PDAs, winners get a proportional share plus 40% of the losing pool. As of March 2026: 43 artists, 647 battles, 423 SOL ($38K) volume.

Existing surfaces:
- `wavewarz.com` - main PWA, where SOL trading happens.
- `wavewarz-intelligence.vercel.app` - analytics, leaderboards, claim tool. Reads Solana onchain via the parser at `src/lib/solana/{pda,parser,hydrate}.ts` (CandyToyBox/wavewarz-intelligence on GitHub).
- `analytics-wave-warz.vercel.app` - charts, volume trends.
- `@WaveWarZ` on X - primary community channel.
- ZAO OS at `/wavewarz` already embeds all three with API routes and a nightly sync cron mirroring battle data into Supabase. Auto-casts spotlight tier promotions to the `/wavewarz` Farcaster channel.

This app is a separate product (mobile-first, fan-facing alert + chat + spectator) that consumes the same source-of-truth data via its own Cloud Function mirror.

## 3. Decisions Locked

| Decision | Choice | Rationale |
|---|---|---|
| Build path | Clean slate in `/wwapp`, port theme + env shape | Honors "rebuild ambitious," avoids parallel-dir mess |
| Tech ambition | Expo SDK 52, TypeScript strict, expo-router, native Firebase | Zaal picked C scope - rebuild ambitious |
| Auth | Email + Apple + Google primary; optional Phantom wallet upgrade | Email/social is low-friction onboarding; wallet only when fan wants claim or own-stats |
| Live trigger | Schedule + admin override + webhook from Hurricane | Schedule covers most sessions, admin handles edge, webhook makes the partnership real |
| Battle data depth | Rich - participants, leaderboard, pool ticker, vote/cheer | Spectator surface, not just alert |
| Sanction | Official | Hurricane will build endpoints we need |
| Data source V1 | Cloud Function scrape of Intelligence (`/leaderboards/artists`, `/artist/[wallet]`, battle pages) every 60s | No public read API exists yet |
| Data source V2 | Swap to Hurricane's `/api/v1/*` endpoints when shipped | One Cloud Function file change; app unchanged |
| Chat V1 | Single global Town Square room | Original spec, simplest |
| Chat V2 | Per-battle rooms (`chat_battle_{id}`) | Schema scoped so adding is one file |
| State | Zustand for client state, React Query for server state | Predictable, no boilerplate |
| UI kit | tamagui (design tokens, dark default, animations, web compat for free) | Faster than rolling tokens by hand |

## 4. Architecture

### 4.1 Stack

- **App:** Expo SDK 52, React Native 0.76, TypeScript strict, expo-router (file-based, types-aware), tamagui.
- **State:** Zustand (`useAuthStore`, `useLiveStore`, `useChatStore`), React Query (server cache).
- **Backend:** Firebase native modules - `@react-native-firebase/{app,auth,firestore,messaging,functions,remote-config,analytics,crashlytics}`. **Not** the JS SDK - real FCM, real APNs, background push, native performance.
- **Auth providers:** `expo-apple-authentication`, `expo-auth-session` (Google), Firebase email magic link.
- **Solana:** `@solana/web3.js` v1, Phantom deeplink (no full wallet adapter - just connect + sign), `tweetnacl` on Cloud Function for sig verify.
- **Build:** EAS Build (dev / preview / production channels). No Expo Go (native modules require dev build).
- **Errors:** Crashlytics (native) + Sentry (JS with sourcemaps). Dual coverage.
- **Analytics:** Firebase Analytics for product events.

### 4.2 Data layers

1. **Source of truth:** WaveWarZ Intelligence (which itself reads Solana onchain via PDA parsing).
2. **Mirror:** Firebase Cloud Function cron, every 60s, scrapes Intelligence pages, normalizes, writes Firestore. When Hurricane ships native API, swap scrape for `fetch` in this one function.
3. **App reads:** Firestore via React Query (paged + cached) and `onSnapshot` for live state. Reactive everywhere.
4. **App writes:** chat messages, user prefs, FCM token registration, wallet linkage. All through Cloud Function callables for validation and rate limiting.

### 4.3 Firestore schema

```
liveState (singleton doc at /app/liveState)
  isLive: boolean
  currentBattleId: string | null
  xSpaceUrl: string | null
  scheduleNext: timestamp
  updatedAt: server timestamp
  updatedBy: 'cron' | 'admin' | 'webhook'

battles/{battleId}
  artistAWallet: string
  artistBWallet: string
  artistAName: string
  artistBName: string
  songA: string | null
  songB: string | null
  poolASol: number
  poolBSol: number
  status: 'upcoming' | 'live' | 'settled'
  type: 'quick' | 'main' | 'benefit'
  startedAt: timestamp | null
  endedAt: timestamp | null
  settledAt: timestamp | null
  winner: 'a' | 'b' | null
  joinUrl: string
  cheerCountA: number  (V2)
  cheerCountB: number  (V2)

artists/{wallet}
  name: string
  twitterHandle: string | null
  avatarUrl: string | null
  wins: number
  losses: number
  winRatePercent: number
  volumeSol: number
  earningsSol: number
  spotlightTier: 'rising_star' | 'veteran' | 'legend' | null
  lastBattleAt: timestamp | null

chat_global/{msgId}
  uid: string
  displayName: string
  text: string (max 240 chars)
  createdAt: server timestamp
  deletedAt: timestamp | null  (soft delete)

chat_battle_{battleId}/{msgId}   (V2 - same shape as chat_global)

users/{uid}
  displayName: string
  email: string
  providerIds: string[]   ('apple.com', 'google.com', 'password')
  solanaWallet: string | null
  fcmTokens: string[]    (max 5, dedup)
  notifPrefs: {
    live: boolean (default true)
    reminders: boolean (default true)
    artistFollows: string[]   (wallets)
    quietHoursStartUtc: number | null   (0-23)
    quietHoursEndUtc: number | null
  }
  isWaveWarZArtist: boolean   (true if solanaWallet matches an artists/{wallet})
  createdAt: server timestamp

adminAllowlist/{email}
  addedBy: string
  addedAt: server timestamp

adminLog/{logId}
  adminEmail: string
  action: string
  payload: object
  at: server timestamp

artistTopics/{wallet}    (just an index for which topics have subscribers)
  subscriberCount: number
```

### 4.4 Cloud Functions

| Function | Trigger | Purpose |
|---|---|---|
| `syncIntelligence` | Pub/Sub cron, every 60s | Scrape Intelligence pages, upsert artists + battles, flip `liveState.isLive` if a battle becomes status=live |
| `onLiveStateChange` | Firestore `liveState` write | If `isLive` flipped false to true, fan out FCM push to topic `live`. Respects per-user quiet hours via per-token check. |
| `onBattleStarted` | Firestore `battles/{id}` write where status: 'upcoming' to 'live' | Fan out FCM push to topic `live` and to `artist:{wallet}` for both participants |
| `liveWebhook` | HTTPS POST `/webhook/live` | Accepts events from Hurricane's system with bearer secret. Maps to Firestore writes. |
| `adminFlipLive` | Callable | Allowlist check, writes `liveState`, logs to `adminLog/` |
| `sendMessage` | Callable | Auth check, rate limit (1 per 3s per uid via distributed counter), profanity filter (`bad-words` package + length cap), writes to `chat_global/` |
| `connectWallet` | Callable | Verifies Phantom signature with `tweetnacl`, writes `solanaWallet` to user doc, recomputes `isWaveWarZArtist` |
| `registerFcmToken` | Callable | Auth check, dedup, max 5 tokens per user |
| `subscribeToTopic` | Callable | Subscribe FCM token to `live`, `reminders`, `artist:{wallet}` topics |

### 4.5 Webhook contract (for Hurricane)

```
POST https://us-central1-wavewarzlive-prod.cloudfunctions.net/liveWebhook
Authorization: Bearer ${WAVEWARZ_WEBHOOK_SECRET}
Content-Type: application/json

{
  "event": "session.live" | "session.ended" | "battle.started" | "battle.settled",
  "occurredAt": "2026-05-05T20:30:00-04:00",
  "battleId": "ww_battle_649",
  "payload": {
    "artistAWallet": "...",
    "artistBWallet": "...",
    "songA": "...",
    "songB": "...",
    "joinUrl": "https://wavewarz.com/battle/649",
    "xSpaceUrl": "https://x.com/i/spaces/..."
  }
}
```

Secret rotated quarterly via 1Password share with Hurricane.

### 4.6 Hosting / environments

- **3 Firebase projects:** `wavewarzlive-dev`, `wavewarzlive-staging`, `wavewarzlive-prod`.
- **3 EAS channels:** matching names.
- **Bundle IDs:** `com.wavewarz.live`, `.staging`, `.dev`.
- **Plan:** Blaze (pay-as-you-go) needed for outbound HTTP from Cloud Functions (the scraper).

## 5. Navigation (expo-router)

```
app/
  _layout.tsx                     # auth gate, providers, tamagui theme
  (auth)/
    welcome.tsx                   # logo, "Sign in to get alerts"
    sign-in.tsx                   # Apple / Google / Email magic link
  (tabs)/
    _layout.tsx                   # bottom tabs
    index.tsx                     # Live (Home)
    battles.tsx                   # Battle list (Live / Upcoming / Recent)
    chat.tsx                      # Town Square
    profile.tsx                   # User + wallet + settings
  battle/[id].tsx                 # Battle detail
  artist/[wallet].tsx             # Artist profile
  admin/live-toggle.tsx           # gated by allowlist
  +not-found.tsx
```

Deep links:
- Custom scheme: `wavewarzlive://battle/{id}`, `wavewarzlive://artist/{wallet}`, `wavewarzlive://chat`
- Universal links: `https://live.wavewarz.com/*` (Apple App Site Association + Android assetlinks)

## 6. Screens

### 6.1 Live (index)

- Hero status card. Live: "LIVE NOW" with pulse, current battle preview. Offline: "Next: Mon 8:30PM EST" with countdown.
- Current battle card if live: artist A vs artist B with avatars, song titles, animated SOL pool split bar, time elapsed, big "Join on wavewarz.com" button + secondary "Open X Space" button.
- Reminder pill if next session is within 2 hours.
- Last result strip: "Top win this week: {artistName}" with W-L delta - tappable to artist. (Per-battle SOL earnings on this platform are typically 0.01-0.05 SOL; show value only when it is meaningful.)
- "Top 5 this week" mini leaderboard - tappable to artist.

### 6.2 Battles

- Three sub-tabs: Live (1+ battles in progress), Upcoming (today's queue), Recent (settled, paginated).
- Each card opens `/battle/[id]`.

### 6.3 Battle detail

- Full pool ticker (live SOL flow with subtle animation).
- Bigger artist cards with W-L, win-rate ring, recent form.
- Song play preview if Audius URL available (V2 only).
- Vote / cheer buttons - free, social signal only, increments Firestore counter (V2).
- "Join on wavewarz.com" button at sticky bottom.
- "Chat about this battle" - V1 routes to Town Square; V2 opens per-battle room.

### 6.4 Town Square

- Single global room V1. Inverted FlatList, auto-scroll to newest.
- Composer pinned bottom, KeyboardAvoidingView, max 240 chars.
- Optimistic insert flagged `pending: true` until server confirms.
- Server callable `sendMessage` validates auth, rate-limits (1 per 3s per uid via Firestore distributed counter), profanity filter, server timestamp.
- Soft-delete via admin: Firestore rules show only non-deleted to non-admins.

### 6.5 Artist profile

- Avatar, twitter handle, W-L record, win-rate ring, volume, earnings.
- Recent battles list.
- "Notify me on next battle" toggle - subscribes FCM token to topic `artist:{wallet}`.

### 6.6 Profile

- Avatar (DiceBear seeded by uid).
- Display name (editable).
- Sign-in providers shown.
- Notification prefs (live / reminders / artist follows / quiet hours).
- "Connect Phantom" card (optional). Once connected: shown wallet address (truncated), disconnect button. If `isWaveWarZArtist`: badge + own stats + claim affordance.
- Sign out.

### 6.7 Admin live-toggle

- Email allowlist check on mount, redirect if not in `adminAllowlist/`.
- Three controls: GO LIVE / END LIVE / SCHEDULE NEXT (datetime picker).
- "Send test push to me only" button.
- All writes via `adminFlipLive` callable, logged to `adminLog/`.

## 7. Auth flow

1. First launch: forced sign-in (welcome to sign-in).
2. User picks Apple / Google / Email.
3. On success: Cloud Function creates `users/{uid}` if missing, returns user doc.
4. App requests notification permissions, registers FCM token, subscribes to default topics (`live`, `reminders`).
5. App requests display name if blank (default = first name from provider), generates DiceBear avatar.
6. Subsequent launches: silent sign-in via Firebase persistence.

Phantom wallet (optional, in Profile):
1. Tap "Connect Phantom" - app opens `phantom://v1/connect?...` deeplink.
2. User approves in Phantom, Phantom returns to app via universal link with pubkey + sig.
3. App calls `connectWallet` callable with pubkey, sig, and a fresh challenge string.
4. Function verifies sig with `tweetnacl`, writes `solanaWallet` to user doc.
5. Function recomputes `isWaveWarZArtist` by checking if wallet matches any `artists/{wallet}`.

## 8. Notifications

### 8.1 Topic strategy

- Default ON for new users: `live`.
- Default OFF: `reminders`, `artist:{wallet}`.
- Topic management is server-side via `subscribeToTopic` callable so we have an audit trail.

### 8.2 Payload shape

```
{
  notification: { title, body },
  data: {
    type: "live" | "reminder" | "artist_battle" | "battle_settled",
    battleId?: string,
    artistWallet?: string,
    deepLink: string
  },
  android: { channelId: "wavewarz-live", priority: "max" },
  apns: {
    sound: "default",
    "interruption-level": "time-sensitive"
  }
}
```

### 8.3 iOS

- Time-Sensitive Notifications entitlement requested (live alerts qualify - they're event-triggered and time-bounded).
- APNs cert uploaded to Firebase project.

### 8.4 Android

- High-priority notification channel `wavewarz-live` registered at app start.
- google-services.json baked into EAS build per env.

### 8.5 Foreground / background

- Foreground: in-app banner via `react-native-toast-message` (no native dropdown).
- Background or terminated: native push lands, tap routes via `Linking.openURL(deepLink)`.

### 8.6 Quiet hours

- Stored on user doc as UTC hours.
- Cloud Function `onLiveStateChange` and friends iterate FCM tokens per user, skip tokens whose owner is in quiet hours, batch into morning digest if needed.

## 9. Wallet integration (optional)

Already covered in 7. Additional behaviors once connected:

- Artist screens for the connected wallet show "You're a WaveWarZ artist" badge and own stats.
- Claim CTA (V2): deep link to `https://wavewarz-intelligence.vercel.app/claim?wallet=...` so user can claim onchain winnings.
- Disconnecting wallet clears `solanaWallet`, recomputes `isWaveWarZArtist`.

## 10. Error handling

| Surface | Strategy |
|---|---|
| Network down | React Query retry (3x, exponential backoff). Offline banner via `@react-native-community/netinfo`. Last-good cache stays visible. |
| Firestore write fail | Optimistic UI rolls back, toast "Try again." |
| Push perm denied | Persistent banner on Live screen "Enable alerts in Settings" with deep link to OS settings. |
| Auth fail | Per-provider clear error, "try a different sign-in" fallback. |
| Phantom connect fail | Clear toast, no partial state written. |
| Cloud Function rate limit hit | Toast "Slow down" + cooldown timer in UI. |
| Native crash | Crashlytics. |
| JS error | Sentry with sourcemaps. |

All Cloud Function errors logged to Cloud Logging with structured fields (`uid`, `fn`, `code`, `requestId`).

## 11. Testing

| Layer | Tool | Target |
|---|---|---|
| Unit (Cloud Functions + pure /lib) | vitest | Node-side logic (rate limit calc, schedule next-window calc, payload shapes). 80% target on `/lib`. |
| Component (RN screens + components) | jest with `jest-expo` preset + react-native-testing-library | Screens. Snapshot StatusCard, BattleCard, ChatMessage. |
| Integration | `firebase-functions-test` + Firestore emulator | Callables (sendMessage, connectWallet, adminFlipLive) and triggers (onLiveStateChange). |
| E2E | Maestro | Sign-in flow, receive push (simulated), open chat, send message. Run on EAS preview against staging Firebase. |
| Manual smoke | Real device, real push, real wavewarz.com link open every release. |

## 12. Observability

- **Firebase Analytics events:** `app_open`, `signin_success`, `push_received`, `push_opened`, `join_battle_tapped`, `chat_sent`, `wallet_connected`, `artist_follow_added`.
- **Crashlytics + Sentry:** dual coverage as above.
- **Cloud Function metrics:** scrape success rate, scrape latency, push fanout count, webhook receipts.
- **Alerts (Cloud Monitoring):** scrape failure 3 in a row triggers email to Zaal. Webhook auth failures trigger immediate email.

## 13. Visual direction

- Dark by default, near-black background (`#070B14`), electric accent: purple to cyan gradient on live elements.
- Large titles (32-40px), bold weights, generous tap targets (54px min).
- Subtle animations: pool bar slides on update, LIVE badge pulses, push response triggers brief screen flash.
- Lottie hero for "WAITING FOR NEXT BATTLE" empty state - slow synthwave pulse.
- Custom font pair: heading = Space Grotesk Bold, body = Inter.
- No emojis anywhere in copy or UI per Zaal's global rule.

## 14. App Store

- Name: "WaveWarZ Live"
- Primary category: Music
- Secondary category: Finance
- Age rating: 17+ (references financial trading, even though app itself does not custody funds)
- Privacy nutrition label: collects email, FCM token, displayName, optional wallet. No tracking ID. No third-party data sharing.
- Apple App Site Association + Android assetlinks for `live.wavewarz.com` universal links.

## 15. V1 vs V2

| Feature | V1 | V2 |
|---|---|---|
| Sign-in (Apple, Google, Email) | yes | - |
| Optional Phantom wallet connect | yes | - |
| Live state hero + push | yes | - |
| Battle list (live, upcoming, recent) | yes | - |
| Battle detail (no audio, no cheers) | yes | - |
| Artist profile + follow | yes | - |
| Town Square global chat | yes | - |
| Admin live-toggle | yes | - |
| Webhook receiver | yes | - |
| Per-battle chat rooms | - | yes |
| Audius song preview audio | - | yes |
| Cheer / vote counters | - | yes |
| Claim CTA on artist screens | - | yes |
| Switch from scrape to Hurricane native API | - | yes |

## 16. Open partnership asks for Hurricane

These are blocking nothing but unlock cleaner data path:

1. Public read API: `/api/v1/artists`, `/api/v1/battles/recent`, `/api/v1/live-state`, `/api/v1/artist/{wallet}`. Even read-only with rate limit is fine.
2. Webhook from his system to ours on the four events listed in 4.5.
3. Use of "WaveWarZ Live" name + logo on App Store and Play Store.
4. Linkback in his pinned X post and on wavewarz.com when V1 ships.
5. CNAME or A-record on `live.wavewarz.com` pointing at our hosting so Apple App Site Association + Android assetlinks for universal links work under his domain.

## 17. Out of scope (V1)

- In-app SOL trading (Hurricane's domain, never ours).
- Custody of any kind.
- Streaming the X Space audio in-app (link out).
- Battle creation / hosting tools for artists.
- ZAO Farcaster integration (separate product).
- Web version (tamagui makes it easy later, but not V1).

## 18. Risks

| Risk | Mitigation |
|---|---|
| Intelligence page structure changes, scraper breaks | Cloud Monitoring alert on 3 failures in a row, fallback to last-good Firestore state, Hurricane API priority |
| Hurricane never ships native API | Scraper continues working; we own the cron |
| iOS Time-Sensitive entitlement denied | Falls back to standard push priority - still works, just less prominent |
| Phantom deeplink flow fails on some devices | Wallet connect is optional; core app works without it |
| FCM topic delivery delays | Fan out to per-token sends from Cloud Function as fallback for `live` event, accept higher cost |
| Apple rejects 17+ "trading" classification | Pivot copy to "spectator," remove "trading" wording in App Store description |
| User base too small at launch to test push fanout | Beta via TestFlight + Play Internal Testing with friends-of-Hurricane first |

## 19. Success criteria for V1

- A user installed at 8:29PM EST Monday gets a push within 60 seconds of Hurricane starting his X Space.
- Tap on push deep-links into Live screen with current battle showing.
- Chat sends with under 500ms perceived latency.
- Crash-free sessions over 99%.
- Less than 1% of pushes failing fanout per Cloud Monitoring.

## 20. Implementation plan reference

Implementation plan lives separately - written by the writing-plans skill after this spec is approved.
