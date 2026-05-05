# WaveWarZ Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship V1 of WaveWarZ Live - a cross-platform iOS + Android alert and spectator app for WaveWarZ Solana music battles.

**Architecture:** Expo SDK 52 + TypeScript + expo-router app. Native Firebase for auth, Firestore, FCM, callables. Cloud Function cron scrapes wavewarz-intelligence.vercel.app every 60s and writes Firestore. Push fanout on liveState change. Optional Phantom wallet via deeplink. Tamagui for UI tokens and animations.

**Tech Stack:**
- Expo SDK 52, React Native 0.76, TypeScript strict
- expo-router (file-based)
- @react-native-firebase/{app,auth,firestore,messaging,functions,remote-config,analytics,crashlytics}
- Zustand + React Query
- tamagui
- @solana/web3.js v1, tweetnacl
- Firebase Cloud Functions (Node 20)
- EAS Build
- jest + jest-expo + react-native-testing-library (RN tests)
- vitest (Node-side / Cloud Functions tests)
- Maestro (E2E)
- Crashlytics + Sentry

**Spec:** `/Users/zaalpanthaki/Documents/wwapp/docs/superpowers/specs/2026-05-05-wavewarz-live-design.md`

---

## Pre-flight

Working directory throughout this plan: `/Users/zaalpanthaki/Documents/wwapp`. All file paths relative to that root unless otherwise noted.

The directory currently holds an Apr-22 Expo SDK 51 JS scaffold. Phase 0 wipes it and re-inits clean. The `.expo/` cache will be regenerated; nothing in the old scaffold needs to be preserved beyond what Phase 0 explicitly ports.

Expected machine prerequisites:
- Node 20.x via `nvm use 20` (verify with `node -v` returning v20.x.x)
- pnpm 9 (`pnpm -v` should return 9.x; install via `npm i -g pnpm@9` if missing)
- Xcode 16.x with iOS 18 simulator runtime
- Android Studio with API 35 emulator
- Firebase CLI 13+ (`npm i -g firebase-tools`)
- EAS CLI (`npm i -g eas-cli`)
- Maestro CLI (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- gh CLI authenticated (`gh auth status` should succeed)

If any are missing, ship-stop and ask Zaal before proceeding.

---

## Phase 0 - Reset and re-init

### Task 0.1: Archive existing scaffold artifacts worth keeping, then wipe

**Files:**
- Read then delete: every file in `/Users/zaalpanthaki/Documents/wwapp/` except `docs/` (specs and plans live here)

- [ ] **Step 1: Capture port-worthy values from existing scaffold**

Read these for reference - we will re-encode them in Phase 1 - then delete:
- `/Users/zaalpanthaki/Documents/wwapp/src/theme/colors.js` (color tokens)
- `/Users/zaalpanthaki/Documents/wwapp/.env.example` (env var names)
- `/Users/zaalpanthaki/Documents/wwapp/app.json` (bundle ids, permissions)

Run:
```bash
cat /Users/zaalpanthaki/Documents/wwapp/src/theme/colors.js
cat /Users/zaalpanthaki/Documents/wwapp/.env.example
cat /Users/zaalpanthaki/Documents/wwapp/app.json
```

Save the printed output to a scratch note for Phase 1 reference.

- [ ] **Step 2: Delete everything except docs/**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
find . -maxdepth 1 -mindepth 1 ! -name docs ! -name .git -exec rm -rf {} +
ls -la
```
Expected: only `docs/` remains (plus `.git` if it exists).

- [ ] **Step 3: Initialize git if missing**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
git init
git add docs/
git commit -m "chore: keep design spec and plan, wipe Apr-22 scaffold"
```
Expected: initial commit on `main` containing only `docs/`.

### Task 0.2: Init fresh Expo SDK 52 TypeScript project in place

**Files:**
- Create: project skeleton via `create-expo-app` template

- [ ] **Step 1: Run create-expo-app with default template**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
npx create-expo-app@latest . --template default@52 --yes --no-install
```
Expected: Expo SDK 52 default template files copied into the current directory (will preserve our `docs/`).

If the CLI refuses to operate in a non-empty directory, run:
```bash
mkdir -p /tmp/wwapp-bootstrap
cd /tmp/wwapp-bootstrap
npx create-expo-app@latest wwapp --template default@52 --yes --no-install
rsync -av --exclude=node_modules /tmp/wwapp-bootstrap/wwapp/ /Users/zaalpanthaki/Documents/wwapp/
rm -rf /tmp/wwapp-bootstrap
```

- [ ] **Step 2: Switch package manager to pnpm**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
rm -f package-lock.json yarn.lock
pnpm install
```
Expected: `pnpm-lock.yaml` created, `node_modules/` populated.

- [ ] **Step 3: Verify Expo CLI sees the project**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec expo --version
pnpm exec expo config --json | head -20
```
Expected: Expo CLI prints a version, `expo config` prints app metadata as JSON.

- [ ] **Step 4: Commit**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
git add .
git commit -m "chore: bootstrap Expo SDK 52 TypeScript project"
```

### Task 0.3: Lock TypeScript to strict + add path alias

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/tsconfig.json`
- Create: `/Users/zaalpanthaki/Documents/wwapp/.eslintrc.js`

- [ ] **Step 1: Replace tsconfig.json with strict config**

Write `/Users/zaalpanthaki/Documents/wwapp/tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@app/*": ["app/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 2: Install eslint + prettier**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add -D eslint@9 @typescript-eslint/parser@8 @typescript-eslint/eslint-plugin@8 eslint-config-expo@8 prettier@3 eslint-plugin-prettier@5 eslint-config-prettier@9
```

- [ ] **Step 3: Write eslint config**

Write `/Users/zaalpanthaki/Documents/wwapp/.eslintrc.js`:
```js
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};
```

Write `/Users/zaalpanthaki/Documents/wwapp/.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true
}
```

- [ ] **Step 4: Verify type check passes**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec tsc --noEmit
```
Expected: zero errors. If template has a type error, stop and report.

- [ ] **Step 5: Commit**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
git add tsconfig.json .eslintrc.js .prettierrc package.json pnpm-lock.yaml
git commit -m "chore: enable strict typescript + eslint + prettier"
```

### Task 0.4: Configure app.json bundle ids and permissions

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app.json`

- [ ] **Step 1: Replace app.json with full config**

Write `/Users/zaalpanthaki/Documents/wwapp/app.json`:
```json
{
  "expo": {
    "name": "WaveWarZ Live",
    "slug": "wavewarz-live",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "scheme": "wavewarzlive",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.wavewarz.live",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "We do not track you.",
        "UIBackgroundModes": ["remote-notification"]
      },
      "entitlements": {
        "com.apple.developer.usernotifications.time-sensitive": true,
        "aps-environment": "production"
      },
      "associatedDomains": ["applinks:live.wavewarz.com"]
    },
    "android": {
      "package": "com.wavewarz.live",
      "permissions": ["POST_NOTIFICATIONS", "INTERNET", "VIBRATE", "WAKE_LOCK"],
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "https", "host": "live.wavewarz.com" }],
          "category": ["BROWSABLE", "DEFAULT"],
          "autoVerify": true
        }
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-notifications",
        { "color": "#A855F7", "sounds": [] }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/messaging",
      "@react-native-firebase/crashlytics",
      [
        "expo-build-properties",
        {
          "ios": { "useFrameworks": "static" },
          "android": { "enableProguardInReleaseBuilds": true }
        }
      ]
    ],
    "experiments": { "typedRoutes": true },
    "extra": {
      "eas": { "projectId": "REPLACE_WITH_EAS_PROJECT_ID_AFTER_eas init" }
    }
  }
}
```

Note the `extra.eas.projectId` placeholder is intentional - it gets filled by `eas init` in Task 14.1.

- [ ] **Step 2: Commit**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
git add app.json
git commit -m "chore: configure app.json bundle ids, entitlements, plugins"
```

---

## Phase 1 - Foundations (theme, env, structure)

### Task 1.1: Source directory layout

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/{config,theme,lib,services,stores,components,hooks,types}/.gitkeep`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/.gitkeep`
- Create: `/Users/zaalpanthaki/Documents/wwapp/maestro/.gitkeep`

- [ ] **Step 1: Make directories**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
mkdir -p src/config src/theme src/lib src/services src/stores src/components src/hooks src/types functions maestro
touch src/config/.gitkeep src/theme/.gitkeep src/lib/.gitkeep src/services/.gitkeep src/stores/.gitkeep src/components/.gitkeep src/hooks/.gitkeep src/types/.gitkeep functions/.gitkeep maestro/.gitkeep
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src functions maestro
git commit -m "chore: scaffold src/ functions/ maestro/ directories"
```

### Task 1.2: Env loader

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/.env.example`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/config/env.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/.gitignore`

- [ ] **Step 1: Write .env.example**

Write `/Users/zaalpanthaki/Documents/wwapp/.env.example`:
```
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_REGION=us-central1
EXPO_PUBLIC_JOIN_BATTLE_URL=https://wavewarz.com
EXPO_PUBLIC_INTELLIGENCE_BASE=https://wavewarz-intelligence.vercel.app
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_PHANTOM_DEEPLINK_RETURN_HOST=live.wavewarz.com
```

- [ ] **Step 2: Write env.ts loader**

Write `/Users/zaalpanthaki/Documents/wwapp/src/config/env.ts`:
```ts
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => process.env[key] ?? fallback;

export const env = {
  firebaseProjectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  firebaseRegion: optional('EXPO_PUBLIC_FIREBASE_REGION', 'us-central1'),
  joinBattleUrl: optional('EXPO_PUBLIC_JOIN_BATTLE_URL', 'https://wavewarz.com'),
  intelligenceBase: optional(
    'EXPO_PUBLIC_INTELLIGENCE_BASE',
    'https://wavewarz-intelligence.vercel.app',
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? null,
  phantomReturnHost: optional('EXPO_PUBLIC_PHANTOM_DEEPLINK_RETURN_HOST', 'live.wavewarz.com'),
} as const;
```

- [ ] **Step 3: Update .gitignore**

Append to `/Users/zaalpanthaki/Documents/wwapp/.gitignore`:
```
.env
.env.local
google-services.json
GoogleService-Info.plist
```

- [ ] **Step 4: Commit**

```bash
git add .env.example src/config/env.ts .gitignore
git commit -m "feat: env loader with typed required/optional vars"
```

### Task 1.3: Tamagui setup

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/tamagui.config.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/theme/tokens.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/theme/index.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/babel.config.js`

- [ ] **Step 1: Install tamagui**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add tamagui@1.117 @tamagui/core@1.117 @tamagui/config@1.117 @tamagui/animations-react-native@1.117 @tamagui/font-inter@1.117 react-native-reanimated@~3.16.0 react-native-svg@15.8.0
pnpm add -D @tamagui/babel-plugin@1.117
```

- [ ] **Step 2: Write theme tokens (port from old scaffold)**

Write `/Users/zaalpanthaki/Documents/wwapp/src/theme/tokens.ts`:
```ts
export const palette = {
  background: '#070B14',
  surface: '#111827',
  surfaceAlt: '#1F2937',
  card: '#0F172A',
  border: '#23314D',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.18)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.18)',
  warning: '#F59E0B',
  accent: '#38BDF8',
  accentStrong: '#A855F7',
} as const;

export const radii = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 30, hero: 36, mega: 44 } as const;
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;
```

- [ ] **Step 3: Write tamagui.config.ts**

Write `/Users/zaalpanthaki/Documents/wwapp/tamagui.config.ts`:
```ts
import { createTamagui, createTokens } from '@tamagui/core';
import { createAnimations } from '@tamagui/animations-react-native';
import { palette, radii, spacing, fontSize } from './src/theme/tokens';

const tokens = createTokens({
  color: palette,
  size: spacing,
  space: spacing,
  radius: radii,
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, max: 9999 },
});

const animations = createAnimations({
  fast: { type: 'spring', damping: 20, stiffness: 250 },
  medium: { type: 'spring', damping: 18, stiffness: 150 },
  slow: { type: 'spring', damping: 15, stiffness: 80 },
});

export const tamaguiConfig = createTamagui({
  tokens,
  animations,
  themes: {
    dark: {
      background: tokens.color.background,
      color: tokens.color.textPrimary,
      borderColor: tokens.color.border,
    },
  },
  defaultTheme: 'dark',
  fonts: {
    body: {
      family: 'Inter',
      size: fontSize,
      weight: { 4: '400', 5: '500', 6: '600', 7: '700', 8: '800', 9: '900' },
    },
    heading: {
      family: 'SpaceGrotesk-Bold',
      size: fontSize,
      weight: { 7: '700', 8: '800', 9: '900' },
    },
  },
});

export type Conf = typeof tamaguiConfig;
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
```

- [ ] **Step 4: Write theme index re-export**

Write `/Users/zaalpanthaki/Documents/wwapp/src/theme/index.ts`:
```ts
export { palette, radii, spacing, fontSize, fontWeight } from './tokens';
export { tamaguiConfig } from '../../tamagui.config';
```

- [ ] **Step 5: Update babel.config.js for tamagui**

Write `/Users/zaalpanthaki/Documents/wwapp/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

- [ ] **Step 6: Verify type check**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add tamagui.config.ts src/theme babel.config.js package.json pnpm-lock.yaml
git commit -m "feat: tamagui theme + design tokens"
```

### Task 1.4: Fonts via expo-font

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/assets/fonts/.gitkeep`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app.json` (already has expo-font plugin)
- Modify: `/Users/zaalpanthaki/Documents/wwapp/src/theme/index.ts`

- [ ] **Step 1: Install fonts**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add expo-font@~13.0.0 @expo-google-fonts/inter@0.2.3 @expo-google-fonts/space-grotesk@0.2.3
```

- [ ] **Step 2: Add font loader hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useAppFonts.ts`:
```ts
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold, SpaceGrotesk_900Black } from '@expo-google-fonts/space-grotesk';

export const useAppFonts = (): boolean => {
  const [loaded] = useFonts({
    Inter: Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'SpaceGrotesk-Black': SpaceGrotesk_900Black,
  });
  return loaded;
};
```

- [ ] **Step 3: Commit**

```bash
git add assets/fonts src/hooks/useAppFonts.ts package.json pnpm-lock.yaml
git commit -m "feat: load Inter + Space Grotesk via expo-font"
```

---

## Phase 2 - Firebase wiring

### Task 2.1: Create three Firebase projects

**Files:** none (manual Firebase Console + CLI work)

- [ ] **Step 1: Authenticate Firebase CLI**

Run:
```bash
firebase login
firebase projects:list
```
Expected: Zaal's account listed; existing projects shown.

- [ ] **Step 2: Create three projects**

Run:
```bash
firebase projects:create wavewarzlive-dev --display-name "WaveWarZ Live (dev)"
firebase projects:create wavewarzlive-staging --display-name "WaveWarZ Live (staging)"
firebase projects:create wavewarzlive-prod --display-name "WaveWarZ Live (prod)"
```
Expected: three projects created. If a project ID is taken, append `-z` and update all references in this plan + `.env.example`.

- [ ] **Step 3: Upgrade prod to Blaze plan in Console**

Manual: open https://console.firebase.google.com/project/wavewarzlive-prod/usage/details and upgrade to Blaze. Required for outbound HTTP from Cloud Functions (the scraper).

Repeat for `wavewarzlive-staging` and `wavewarzlive-dev`.

Stop and confirm with Zaal that billing has been set up before continuing.

- [ ] **Step 4: Initialize firebase.json in repo**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase init --project wavewarzlive-dev
```
Select: Firestore, Functions, Emulators. Use existing `functions/` directory. Choose TypeScript. Use ESLint. Install dependencies.

For Emulators select: Auth, Functions, Firestore, Pub/Sub. Default ports.

- [ ] **Step 5: Add aliases for staging and prod**

Run:
```bash
firebase use --add wavewarzlive-staging --alias staging
firebase use --add wavewarzlive-prod --alias prod
firebase use --add wavewarzlive-dev --alias dev
firebase use dev
```

- [ ] **Step 6: Commit**

```bash
git add firebase.json firestore.rules firestore.indexes.json .firebaserc functions/
git commit -m "chore: init firebase project (3 envs aliased dev/staging/prod)"
```

### Task 2.2: Install Firebase native modules

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/package.json` via pnpm

- [ ] **Step 1: Install RN Firebase packages**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @react-native-firebase/app@^21.0.0 @react-native-firebase/auth@^21.0.0 @react-native-firebase/firestore@^21.0.0 @react-native-firebase/messaging@^21.0.0 @react-native-firebase/functions@^21.0.0 @react-native-firebase/remote-config@^21.0.0 @react-native-firebase/analytics@^21.0.0 @react-native-firebase/crashlytics@^21.0.0
```

- [ ] **Step 2: Generate prebuild folders**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec expo prebuild --clean
```
Expected: `ios/` and `android/` directories created with native projects.

- [ ] **Step 3: Add ios/ and android/ to .gitignore (we manage via Expo config plugins)**

Append to `/Users/zaalpanthaki/Documents/wwapp/.gitignore`:
```
ios/
android/
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "feat: install RN Firebase native modules"
```

### Task 2.3: Wire google-services files (per env, gitignored)

**Files:**
- Created locally only: `google-services.json`, `GoogleService-Info.plist`

- [ ] **Step 1: Register iOS app in dev project**

Manual via Console: `https://console.firebase.google.com/project/wavewarzlive-dev/settings/general` -> Add app -> iOS -> bundle id `com.wavewarz.live.dev`. Download `GoogleService-Info.plist`.

- [ ] **Step 2: Register Android app in dev project**

Same console page -> Add app -> Android -> package `com.wavewarz.live.dev`. Download `google-services.json`.

- [ ] **Step 3: Place files at project root**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
mv ~/Downloads/GoogleService-Info.plist ./GoogleService-Info.plist
mv ~/Downloads/google-services.json ./google-services.json
```

- [ ] **Step 4: Wire into app.json**

Edit `/Users/zaalpanthaki/Documents/wwapp/app.json` ios section to add `"googleServicesFile": "./GoogleService-Info.plist"` and android section to add `"googleServicesFile": "./google-services.json"`.

- [ ] **Step 5: Re-prebuild**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec expo prebuild --clean
```

- [ ] **Step 6: Repeat for staging + prod with their bundle id suffixes**

Repeat steps 1-3 for staging (bundle `com.wavewarz.live.staging`) and prod (`com.wavewarz.live`). Save to `secrets/staging/` and `secrets/prod/` (also gitignored). EAS will pick the right pair per channel via env-specific config in Phase 14.

- [ ] **Step 7: Commit (no secrets in repo)**

```bash
git add app.json
git commit -m "chore: wire google-services files via app.json"
```

### Task 2.4: Cloud Functions skeleton

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/package.json`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/tsconfig.json`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/index.ts`

- [ ] **Step 1: Configure functions/package.json**

Replace `/Users/zaalpanthaki/Documents/wwapp/functions/package.json` with:
```json
{
  "name": "wavewarz-live-functions",
  "private": true,
  "main": "lib/index.js",
  "engines": { "node": "20" },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "pnpm build && firebase emulators:start --only functions,firestore",
    "deploy": "firebase deploy --only functions",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.1.0",
    "cheerio": "^1.0.0",
    "zod": "^3.23.8",
    "tweetnacl": "^1.0.3",
    "bs58": "^6.0.0",
    "bad-words": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@types/bad-words": "^3.0.3"
  }
}
```

- [ ] **Step 2: Functions tsconfig**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2022",
    "lib": ["es2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Stub index.ts**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/index.ts`:
```ts
import * as admin from 'firebase-admin';

admin.initializeApp();

export { syncIntelligence } from './syncIntelligence';
export { onLiveStateChange } from './onLiveStateChange';
export { onBattleStarted } from './onBattleStarted';
export { liveWebhook } from './liveWebhook';
export { adminFlipLive } from './adminFlipLive';
export { sendMessage } from './sendMessage';
export { connectWallet } from './connectWallet';
export { registerFcmToken } from './registerFcmToken';
export { subscribeToTopic } from './subscribeToTopic';
```

Each named export will be implemented in subsequent tasks. The plan is structured so each function gets its own task.

- [ ] **Step 4: Install function deps**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
npm install
```
(Functions uses npm because firebase-tools expects it for deploy. Root project uses pnpm.)

- [ ] **Step 5: Commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
git add functions/
git commit -m "chore: scaffold Cloud Functions package + entry barrel"
```

---

## Phase 3 - Firestore schema and rules

### Task 3.1: Write firestore.rules

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/firestore.rules`

- [ ] **Step 1: Replace default rules with explicit per-collection rules**

Write `/Users/zaalpanthaki/Documents/wwapp/firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() &&
             exists(/databases/$(database)/documents/adminAllowlist/$(request.auth.token.email));
    }
    function notDeleted(doc) { return !('deletedAt' in doc) || doc.deletedAt == null; }

    match /app/liveState {
      allow read: if isSignedIn();
      allow write: if false; // Cloud Functions only
    }

    match /battles/{battleId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /artists/{wallet} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /chat_global/{msgId} {
      allow read: if isSignedIn() && notDeleted(resource.data);
      allow create: if false; // sendMessage callable only
      allow update, delete: if isAdmin();
    }

    match /chat_battle_{battleId}/{msgId} {
      allow read: if isSignedIn() && notDeleted(resource.data);
      allow create: if false;
      allow update, delete: if isAdmin();
    }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow create, update: if isSignedIn() && request.auth.uid == uid
        && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['displayName', 'notifPrefs']);
      // FCM tokens, wallet, providerIds set via callables only
    }

    match /adminAllowlist/{email} {
      allow read: if isAdmin();
      allow write: if false;
    }

    match /adminLog/{logId} {
      allow read: if isAdmin();
      allow write: if false;
    }

    match /artistTopics/{wallet} {
      allow read: if isSignedIn();
      allow write: if false;
    }
  }
}
```

- [ ] **Step 2: Validate rules syntactically**

Run:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only firestore:rules --project dev --dry-run
```
Expected: rules parse without errors.

- [ ] **Step 3: Deploy rules to dev**

```bash
firebase deploy --only firestore:rules --project dev
```

- [ ] **Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat: firestore rules locked to callable + admin writes"
```

### Task 3.2: Firestore composite indexes

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/firestore.indexes.json`

- [ ] **Step 1: Define needed indexes**

Write `/Users/zaalpanthaki/Documents/wwapp/firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "battles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "battles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "settledAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "artists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "wins", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "artists",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "volumeSol", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "chat_global",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "deletedAt", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 2: Deploy indexes**

```bash
firebase deploy --only firestore:indexes --project dev
```

- [ ] **Step 3: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat: firestore composite indexes for battles, artists, chat"
```

### Task 3.3: TypeScript types for Firestore docs (shared between app + functions)

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/types/firestore.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/types.ts` (mirror)

- [ ] **Step 1: Write shared types**

Write `/Users/zaalpanthaki/Documents/wwapp/src/types/firestore.ts`:
```ts
export type ServerTimestamp = { toMillis(): number; toDate(): Date };

export interface LiveState {
  isLive: boolean;
  currentBattleId: string | null;
  xSpaceUrl: string | null;
  scheduleNext: ServerTimestamp | null;
  updatedAt: ServerTimestamp;
  updatedBy: 'cron' | 'admin' | 'webhook';
}

export type BattleStatus = 'upcoming' | 'live' | 'settled';
export type BattleType = 'quick' | 'main' | 'benefit';

export interface Battle {
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
  displayName: string;
  email: string;
  providerIds: string[];
  solanaWallet: string | null;
  fcmTokens: string[];
  notifPrefs: NotifPrefs;
  isWaveWarZArtist: boolean;
  createdAt: ServerTimestamp;
}
```

- [ ] **Step 2: Mirror types in functions package (avoid cross-package imports)**

Copy the same content to `/Users/zaalpanthaki/Documents/wwapp/functions/src/types.ts` with `ServerTimestamp` re-typed as `admin.firestore.Timestamp`:
```ts
import * as admin from 'firebase-admin';

type ServerTimestamp = admin.firestore.Timestamp;

// (... rest identical to src/types/firestore.ts ...)
```

Write the full mirrored file with that one substitution.

- [ ] **Step 3: Commit**

```bash
git add src/types/firestore.ts functions/src/types.ts
git commit -m "feat: shared Firestore document types"
```

---

## Phase 4 - App skeleton (expo-router + providers)

### Task 4.1: Root layout + providers

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/lib/queryClient.ts`

- [ ] **Step 1: Install React Query and Zustand**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @tanstack/react-query@^5.59.0 zustand@^5.0.0
```

- [ ] **Step 2: Write query client**

Write `/Users/zaalpanthaki/Documents/wwapp/src/lib/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});
```

- [ ] **Step 3: Write root layout**

Write `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { TamaguiProvider } from '@tamagui/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { tamaguiConfig } from '@/theme';
import { queryClient } from '@/lib/queryClient';
import { useAppFonts } from '@/hooks/useAppFonts';

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070B14' } }} />
          </SafeAreaProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Install gesture handler + safe area**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add react-native-gesture-handler@~2.20.0 react-native-safe-area-context@~4.12.0
```

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx src/lib/queryClient.ts package.json pnpm-lock.yaml
git commit -m "feat: root layout with tamagui, react-query, safe area"
```

### Task 4.2: Tab layout placeholder

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/_layout.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/index.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/battles.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/chat.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/profile.tsx`

- [ ] **Step 1: Install expo-router and bottom tabs**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add expo-router@~4.0.0 @react-navigation/bottom-tabs@^7.0.0 @react-navigation/native@^7.0.0 react-native-screens@~4.0.0 expo-linking@~7.0.0 expo-constants@~17.0.0
```

- [ ] **Step 2: Update package.json main**

Edit `/Users/zaalpanthaki/Documents/wwapp/package.json` to set `"main": "expo-router/entry"`.

- [ ] **Step 3: Tab layout**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          height: 76,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarActiveTintColor: palette.textPrimary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="battles"
        options={{
          title: 'Battles',
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Town Square',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Install vector icons**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @expo/vector-icons@^14.0.0
```

- [ ] **Step 5: Stub each tab screen**

Each of these files gets the same skeleton with its title. Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/index.tsx`:
```tsx
import { Text, View } from 'react-native';
import { palette } from '@/theme';

export default function LiveScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
      <Text style={{ color: palette.textPrimary, fontSize: 24, fontFamily: 'SpaceGrotesk-Bold' }}>Live</Text>
    </View>
  );
}
```

Same shape for `battles.tsx` (title "Battles"), `chat.tsx` (title "Town Square"), `profile.tsx` (title "Profile"). Replace component name and title text per file.

- [ ] **Step 6: Verify the app boots**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec expo start --ios
```
Expected: simulator opens, four tabs visible, tapping each shows the title text.

- [ ] **Step 7: Commit**

```bash
git add app/ package.json pnpm-lock.yaml
git commit -m "feat: 4-tab layout with placeholder screens"
```

### Task 4.3: Auth route group + welcome screen

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/_layout.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/welcome.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Auth layout**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070B14' } }} />;
}
```

- [ ] **Step 2: Welcome screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/welcome.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, fontSize } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl, backgroundColor: palette.background }}>
      <Text style={{ color: palette.accentStrong, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
        WaveWarZ Live
      </Text>
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.mega, fontWeight: '900', lineHeight: 48, fontFamily: 'SpaceGrotesk-Black' }}>
        Don't miss a battle.
      </Text>
      <Text style={{ color: palette.textSecondary, fontSize: fontSize.md, lineHeight: 24, fontFamily: 'Inter' }}>
        Get pushed the second a WaveWarZ session goes live. Watch the SOL pool shift in real time.
      </Text>
      <Pressable
        onPress={() => router.push('/(auth)/sign-in')}
        style={{ backgroundColor: palette.accentStrong, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: spacing.xxl }}
      >
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800', fontFamily: 'Inter-Bold' }}>
          Sign in to get alerts
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Sign-in placeholder**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`:
```tsx
import { View, Text } from 'react-native';
import { palette, spacing, fontSize } from '@/theme';

export default function SignInScreen() {
  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background, justifyContent: 'center' }}>
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
        Sign in
      </Text>
      <Text style={{ color: palette.textSecondary, fontSize: fontSize.md }}>Apple, Google, Email - coming next task.</Text>
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: welcome + sign-in route stubs"
```

---

## Phase 5 - Auth (Apple, Google, Email)

### Task 5.1: Auth store + Firebase init

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/services/firebase.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/stores/useAuthStore.ts`

- [ ] **Step 1: Firebase service barrel**

Write `/Users/zaalpanthaki/Documents/wwapp/src/services/firebase.ts`:
```ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { env } from '@/config/env';

functions().useFunctionsEmulator?.bind(functions());
// Real region selection happens at call site via httpsCallable region option in v21

export { auth, firestore, functions, messaging, analytics, crashlytics };

export const fnRegion = env.firebaseRegion;
```

- [ ] **Step 2: Auth store**

Write `/Users/zaalpanthaki/Documents/wwapp/src/stores/useAuthStore.ts`:
```ts
import { create } from 'zustand';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setInitializing: (initializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initializing: true,
  setUser: (user) => set({ user }),
  setInitializing: (initializing) => set({ initializing }),
}));
```

- [ ] **Step 3: Auth bootstrap hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useAuthBootstrap.ts`:
```ts
import { useEffect } from 'react';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/stores/useAuthStore';

export const useAuthBootstrap = (): void => {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsub;
  }, [setUser, setInitializing]);
};
```

- [ ] **Step 4: Wire bootstrap into root layout**

Edit `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx` to call `useAuthBootstrap()` inside `RootLayout` and gate render on `useAuthStore.initializing`. Replace the body with:
```tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { tamaguiConfig } from '@/theme';
import { queryClient } from '@/lib/queryClient';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useAuthStore } from '@/stores/useAuthStore';

function RootStack() {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/welcome');
    if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, initializing, segments, router]);

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070B14' } }} />;
}

export default function RootLayout() {
  useAuthBootstrap();
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <RootStack />
          </SafeAreaProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/services/firebase.ts src/stores/useAuthStore.ts src/hooks/useAuthBootstrap.ts app/_layout.tsx
git commit -m "feat: auth store + bootstrap + auth-gated navigation"
```

### Task 5.2: Email magic link sign-in

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Auth service**

Write `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`:
```ts
import { auth } from './firebase';
import { Linking } from 'react-native';

const ACTION_CODE_SETTINGS = {
  url: 'https://live.wavewarz.com/email-link-finish',
  handleCodeInApp: true,
  iOS: { bundleId: 'com.wavewarz.live' },
  android: { packageName: 'com.wavewarz.live', installApp: false, minimumVersion: '0.1.0' },
  dynamicLinkDomain: undefined,
};

export const sendEmailLink = async (email: string): Promise<void> => {
  await auth().sendSignInLinkToEmail(email, ACTION_CODE_SETTINGS);
};

export const completeEmailLink = async (email: string, link: string): Promise<void> => {
  if (!auth().isSignInWithEmailLink(link)) throw new Error('Not a sign-in link');
  await auth().signInWithEmailLink(email, link);
};

export const handleIncomingLink = async (storedEmail: string | null): Promise<void> => {
  const initialUrl = await Linking.getInitialURL();
  if (!initialUrl || !storedEmail) return;
  if (auth().isSignInWithEmailLink(initialUrl)) {
    await auth().signInWithEmailLink(storedEmail, initialUrl);
  }
};

export const signOut = async (): Promise<void> => {
  await auth().signOut();
};
```

- [ ] **Step 2: Email sign-in UI**

Replace `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { palette, spacing, fontSize } from '@/theme';
import { sendEmailLink } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleEmailLink = async () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    try {
      setBusy(true);
      await sendEmailLink(email);
      await AsyncStorage.setItem('pendingSignInEmail', email);
      Alert.alert('Check your email', 'Tap the link we sent to finish signing in.');
    } catch (err) {
      Alert.alert('Sign-in failed', String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: palette.background, justifyContent: 'center' }}>
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
        Sign in
      </Text>

      <TextInput
        placeholder="you@example.com"
        placeholderTextColor={palette.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderColor: palette.border,
          borderWidth: 1,
          padding: 16,
          color: palette.textPrimary,
          fontSize: fontSize.md,
        }}
      />

      <Pressable
        disabled={busy}
        onPress={handleEmailLink}
        style={{
          backgroundColor: palette.accentStrong,
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: 'center',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800' }}>
          {busy ? 'Sending...' : 'Email me a sign-in link'}
        </Text>
      </Pressable>

      <Text style={{ color: palette.textMuted, fontSize: fontSize.sm, textAlign: 'center' }}>
        Apple + Google sign-in next.
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Install AsyncStorage**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @react-native-async-storage/async-storage@~2.0.0
```

- [ ] **Step 4: Enable Email Link in Firebase Console**

Manual: open https://console.firebase.google.com/project/wavewarzlive-dev/authentication/providers -> Email/Password -> enable Email link (passwordless sign-in).

- [ ] **Step 5: Commit**

```bash
git add src/services/auth.ts app/(auth)/sign-in.tsx package.json pnpm-lock.yaml
git commit -m "feat: email magic link sign-in"
```

### Task 5.3: Apple sign-in

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Install Apple auth**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add expo-apple-authentication@~7.0.0
```

- [ ] **Step 2: Append Apple sign-in to auth.ts**

Append to `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`:
```ts
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth as firebaseAuth } from './firebase';

export const signInWithApple = async (): Promise<void> => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple sign-in returned no identity token');
  const provider = firebaseAuth.AppleAuthProvider;
  const appleCred = provider.credential(credential.identityToken, credential.authorizationCode ?? undefined);
  await firebaseAuth().signInWithCredential(appleCred);
};
```

- [ ] **Step 3: Add Apple button to sign-in screen**

In `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`, import:
```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple } from '@/services/auth';
```

Add above the email input:
```tsx
<AppleAuthentication.AppleAuthenticationButton
  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
  cornerRadius={16}
  style={{ height: 54 }}
  onPress={async () => {
    try { await signInWithApple(); } catch (err) { Alert.alert('Apple sign-in failed', String(err)); }
  }}
/>
<Text style={{ color: palette.textMuted, textAlign: 'center' }}>or</Text>
```

- [ ] **Step 4: Enable Apple in Firebase Console**

Manual: Authentication -> Sign-in method -> Apple -> enable. Add Service ID, key, team ID per Firebase docs.

- [ ] **Step 5: Commit**

```bash
git add src/services/auth.ts app/(auth)/sign-in.tsx package.json pnpm-lock.yaml
git commit -m "feat: Apple sign-in"
```

### Task 5.4: Google sign-in

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(auth)/sign-in.tsx`

- [ ] **Step 1: Install Google sign-in**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @react-native-google-signin/google-signin@^13.1.0
```

- [ ] **Step 2: Add Google plugin entry to app.json**

Add to `app.json` plugins array:
```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.REPLACE_WITH_REVERSED_CLIENT_ID"
  }
]
```

The reversed client ID comes from `GoogleService-Info.plist` field `REVERSED_CLIENT_ID`.

- [ ] **Step 3: Append Google sign-in to auth.ts**

Append to `/Users/zaalpanthaki/Documents/wwapp/src/services/auth.ts`:
```ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogle = (): void => {
  GoogleSignin.configure({
    webClientId: 'REPLACE_WITH_WEB_CLIENT_ID_FROM_FIREBASE_CONSOLE',
  });
};

export const signInWithGoogle = async (): Promise<void> => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;
  if (!idToken) throw new Error('Google sign-in returned no id token');
  const cred = firebaseAuth.GoogleAuthProvider.credential(idToken);
  await firebaseAuth().signInWithCredential(cred);
};
```

- [ ] **Step 4: Call configureGoogle on app boot**

In `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useAuthBootstrap.ts`, add at top of effect:
```ts
import { configureGoogle } from '@/services/auth';
// ...
useEffect(() => {
  configureGoogle();
  const unsub = auth().onAuthStateChanged(...);
  return unsub;
}, []);
```

- [ ] **Step 5: Add Google button to sign-in screen**

In sign-in.tsx, between Apple button and email input:
```tsx
<Pressable
  onPress={async () => { try { await signInWithGoogle(); } catch (err) { Alert.alert('Google sign-in failed', String(err)); } }}
  style={{ backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
>
  <Text style={{ color: '#1F2937', fontSize: fontSize.md, fontWeight: '700' }}>Continue with Google</Text>
</Pressable>
```

- [ ] **Step 6: Enable Google in Firebase Console**

Manual: Authentication -> Sign-in method -> Google -> enable. Copy Web client ID into `configureGoogle` (replace placeholder).

- [ ] **Step 7: Commit**

```bash
git add src/services/auth.ts src/hooks/useAuthBootstrap.ts app/(auth)/sign-in.tsx app.json package.json pnpm-lock.yaml
git commit -m "feat: Google sign-in"
```

### Task 5.5: User doc creation on first sign-in (Cloud Function)

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/onAuthUserCreate.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/functions/src/index.ts`

- [ ] **Step 1: Write the failing test**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/onAuthUserCreate.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { buildUserDoc } from './onAuthUserCreate';

describe('buildUserDoc', () => {
  it('creates a user doc with defaults', () => {
    const doc = buildUserDoc({
      uid: 'u1',
      email: 'a@b.com',
      displayName: 'Alice',
      providerData: [{ providerId: 'apple.com' }],
    });
    expect(doc.email).toBe('a@b.com');
    expect(doc.displayName).toBe('Alice');
    expect(doc.providerIds).toEqual(['apple.com']);
    expect(doc.notifPrefs.live).toBe(true);
    expect(doc.notifPrefs.reminders).toBe(true);
    expect(doc.fcmTokens).toEqual([]);
    expect(doc.solanaWallet).toBeNull();
    expect(doc.isWaveWarZArtist).toBe(false);
  });

  it('falls back when displayName is missing', () => {
    const doc = buildUserDoc({ uid: 'u1', email: 'a@b.com', displayName: null, providerData: [] });
    expect(doc.displayName).toBe('Anonymous Trader');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run onAuthUserCreate.test.ts
```
Expected: FAIL with "Cannot find module './onAuthUserCreate'".

- [ ] **Step 3: Implement onAuthUserCreate**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/onAuthUserCreate.ts`:
```ts
import { auth as functionsAuth } from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import type { UserDoc } from './types';

interface UserInput {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerData: Array<{ providerId: string }>;
}

export const buildUserDoc = (u: UserInput): Omit<UserDoc, 'createdAt'> & { createdAt: admin.firestore.FieldValue } => ({
  displayName: u.displayName ?? 'Anonymous Trader',
  email: u.email ?? '',
  providerIds: u.providerData.map((p) => p.providerId),
  solanaWallet: null,
  fcmTokens: [],
  notifPrefs: {
    live: true,
    reminders: true,
    artistFollows: [],
    quietHoursStartUtc: null,
    quietHoursEndUtc: null,
  },
  isWaveWarZArtist: false,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

export const onAuthUserCreate = functionsAuth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const ref = db.collection('users').doc(user.uid);
  const existing = await ref.get();
  if (existing.exists) return;
  await ref.set(
    buildUserDoc({
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      providerData: user.providerData ?? [],
    }),
  );
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run onAuthUserCreate.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Export from index**

Edit `/Users/zaalpanthaki/Documents/wwapp/functions/src/index.ts` and add:
```ts
export { onAuthUserCreate } from './onAuthUserCreate';
```

- [ ] **Step 6: Deploy to dev**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:onAuthUserCreate --project dev
```
Expected: deploy succeeds.

- [ ] **Step 7: Commit**

```bash
git add functions/src/onAuthUserCreate.ts functions/src/onAuthUserCreate.test.ts functions/src/index.ts
git commit -m "feat: create user doc on first sign-in (TDD)"
```

---

## Phase 6 - Live state + Home screen

### Task 6.1: useLiveState hook reading Firestore

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useLiveState.ts`

- [ ] **Step 1: Write the hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useLiveState.ts`:
```ts
import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import type { LiveState } from '@/types/firestore';

const DEFAULT_STATE: LiveState = {
  isLive: false,
  currentBattleId: null,
  xSpaceUrl: null,
  scheduleNext: null,
  updatedAt: { toMillis: () => 0, toDate: () => new Date(0) },
  updatedBy: 'cron',
};

export const useLiveState = (): { state: LiveState; loading: boolean } => {
  const [state, setState] = useState<LiveState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firestore()
      .doc('app/liveState')
      .onSnapshot(
        (snap) => {
          if (snap.exists) setState({ ...DEFAULT_STATE, ...(snap.data() as Partial<LiveState>) });
          setLoading(false);
        },
        () => setLoading(false),
      );
    return unsub;
  }, []);

  return { state, loading };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useLiveState.ts
git commit -m "feat: useLiveState hook with Firestore snapshot listener"
```

### Task 6.2: StatusCard component

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/components/StatusCard.tsx`

- [ ] **Step 1: Component**

Write `/Users/zaalpanthaki/Documents/wwapp/src/components/StatusCard.tsx`:
```tsx
import { View, Text } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { LiveState } from '@/types/firestore';

const formatNextSession = (next: LiveState['scheduleNext']): string => {
  if (!next) return 'Mon-Fri 8:30PM EST. Sun feature 7PM EST.';
  const date = next.toDate();
  return date.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
};

interface Props {
  state: LiveState;
}

export const StatusCard = ({ state }: Props) => {
  const isLive = state.isLive;
  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: isLive ? palette.successDim : palette.dangerDim,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
        }}
      >
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 0.4 }}>
          {isLive ? 'LIVE NOW' : 'OFFLINE'}
        </Text>
      </View>

      <Text style={{ color: palette.textPrimary, fontSize: fontSize.xl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
        {isLive ? 'A battle is live right now' : 'Stay ready for the next session'}
      </Text>

      <Text style={{ color: palette.textSecondary, fontSize: fontSize.md, lineHeight: 24 }}>
        {isLive ? 'Tap below to jump in.' : `Next: ${formatNextSession(state.scheduleNext)}`}
      </Text>
    </View>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatusCard.tsx
git commit -m "feat: StatusCard component (live + offline states)"
```

### Task 6.3: Wire Live screen

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/index.tsx`

- [ ] **Step 1: Replace Live screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/index.tsx`:
```tsx
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { StatusCard } from '@/components/StatusCard';
import { useLiveState } from '@/hooks/useLiveState';
import { env } from '@/config/env';

export default function LiveScreen() {
  const { state } = useLiveState();
  const targetUrl = state.xSpaceUrl ?? env.joinBattleUrl;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
      <View style={{ gap: spacing.md }}>
        <Text style={{ color: palette.accentStrong, fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
          WaveWarZ Live
        </Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.hero, fontWeight: '900', lineHeight: 42, fontFamily: 'SpaceGrotesk-Black' }}>
          Battle alerts, the moment they hit.
        </Text>
      </View>

      <StatusCard state={state} />

      <Pressable
        onPress={() => Linking.openURL(targetUrl)}
        style={{
          backgroundColor: state.isLive ? palette.accentStrong : palette.surface,
          paddingVertical: 18,
          borderRadius: radii.md,
          alignItems: 'center',
          borderWidth: state.isLive ? 0 : 1,
          borderColor: palette.border,
        }}
      >
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800' }}>
          {state.isLive ? 'Join the Battle' : 'Open wavewarz.com'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: Live screen wired to live state"
```

---

## Phase 7 - Battles list + detail

### Task 7.1: Battles query hook

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useBattles.ts`

- [ ] **Step 1: Write hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useBattles.ts`:
```ts
import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import type { Battle, BattleStatus } from '@/types/firestore';

export type BattleWithId = Battle & { id: string };

export const useBattles = (status: BattleStatus, limit = 50) => {
  const [data, setData] = useState<BattleWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderField = status === 'settled' ? 'settledAt' : 'startedAt';
    const unsub = firestore()
      .collection('battles')
      .where('status', '==', status)
      .orderBy(orderField, 'desc')
      .limit(limit)
      .onSnapshot(
        (snap) => {
          setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Battle) })));
          setLoading(false);
        },
        () => setLoading(false),
      );
    return unsub;
  }, [status, limit]);

  return { data, loading };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useBattles.ts
git commit -m "feat: useBattles hook (live, upcoming, settled)"
```

### Task 7.2: BattleCard component

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/components/BattleCard.tsx`

- [ ] **Step 1: Component**

Write `/Users/zaalpanthaki/Documents/wwapp/src/components/BattleCard.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { BattleWithId } from '@/hooks/useBattles';

const splitWidth = (a: number, b: number): { aPct: number; bPct: number } => {
  const total = a + b;
  if (total === 0) return { aPct: 50, bPct: 50 };
  const aPct = Math.round((a / total) * 100);
  return { aPct, bPct: 100 - aPct };
};

interface Props {
  battle: BattleWithId;
}

export const BattleCard = ({ battle }: Props) => {
  const router = useRouter();
  const { aPct, bPct } = splitWidth(battle.poolASol, battle.poolBSol);
  const totalPool = (battle.poolASol + battle.poolBSol).toFixed(2);
  const statusColor =
    battle.status === 'live' ? palette.success : battle.status === 'upcoming' ? palette.warning : palette.textMuted;

  return (
    <Pressable
      onPress={() => router.push(`/battle/${battle.id}`)}
      style={{
        backgroundColor: palette.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: statusColor, fontSize: fontSize.xs, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {battle.status}
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.sm }}>{totalPool} SOL pool</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}>{battle.artistAName}</Text>
          {battle.songA ? <Text style={{ color: palette.textMuted, fontSize: fontSize.sm }}>{battle.songA}</Text> : null}
        </View>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.lg, fontWeight: '900' }}>vs</Text>
        <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}>{battle.artistBName}</Text>
          {battle.songB ? <Text style={{ color: palette.textMuted, fontSize: fontSize.sm }}>{battle.songB}</Text> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${aPct}%`, backgroundColor: palette.accentStrong }} />
        <View style={{ width: `${bPct}%`, backgroundColor: palette.accent }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.xs }}>{aPct}%</Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.xs }}>{bPct}%</Text>
      </View>
    </Pressable>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BattleCard.tsx
git commit -m "feat: BattleCard with pool split bar"
```

### Task 7.3: Battles tab screen

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/battles.tsx`

- [ ] **Step 1: Battles list**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/battles.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useBattles } from '@/hooks/useBattles';
import { BattleCard } from '@/components/BattleCard';
import type { BattleStatus } from '@/types/firestore';

const TABS: BattleStatus[] = ['live', 'upcoming', 'settled'];
const LABELS: Record<BattleStatus, string> = { live: 'Live', upcoming: 'Upcoming', settled: 'Recent' };

export default function BattlesScreen() {
  const [active, setActive] = useState<BattleStatus>('live');
  const { data, loading } = useBattles(active);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg }}>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
          Battles
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setActive(t)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.pill,
                backgroundColor: active === t ? palette.accentStrong : palette.surface,
              }}
            >
              <Text style={{ color: palette.textPrimary, fontWeight: '700' }}>{LABELS[t]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        renderItem={({ item }) => <BattleCard battle={item} />}
        ListEmptyComponent={
          <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.xxxl, fontSize: fontSize.md }}>
            {loading ? 'Loading...' : 'No battles in this state right now.'}
          </Text>
        }
      />
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/battles.tsx
git commit -m "feat: Battles tab with live/upcoming/recent filters"
```

### Task 7.4: Battle detail screen

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/battle/[id].tsx`

- [ ] **Step 1: Detail screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/battle/[id].tsx`:
```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { firestore } from '@/services/firebase';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { Battle } from '@/types/firestore';

export default function BattleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [battle, setBattle] = useState<(Battle & { id: string }) | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = firestore()
      .doc(`battles/${id}`)
      .onSnapshot((snap) => {
        if (snap.exists) setBattle({ id: snap.id, ...(snap.data() as Battle) });
      });
    return unsub;
  }, [id]);

  if (!battle) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Loading battle...</Text>
      </View>
    );
  }

  const totalPool = (battle.poolASol + battle.poolBSol).toFixed(2);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Stack.Screen options={{ headerShown: true, title: 'Battle', headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.textPrimary, headerLeft: () => (
        <Pressable onPress={() => router.back()}><Text style={{ color: palette.accent, fontSize: fontSize.md }}>Back</Text></Pressable>
      ) }} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.hero, fontWeight: '900', fontFamily: 'SpaceGrotesk-Black' }}>
          {battle.artistAName} vs {battle.artistBName}
        </Text>

        <View style={{ backgroundColor: palette.card, padding: spacing.lg, borderRadius: radii.lg, gap: spacing.md, borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ color: palette.textSecondary, fontSize: fontSize.sm }}>Total pool</Text>
          <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900' }}>{totalPool} SOL</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: palette.textPrimary }}>{battle.artistAName}: {battle.poolASol.toFixed(2)} SOL</Text>
            <Text style={{ color: palette.textPrimary }}>{battle.artistBName}: {battle.poolBSol.toFixed(2)} SOL</Text>
          </View>
        </View>

        <Pressable
          onPress={() => Linking.openURL(battle.joinUrl)}
          style={{ backgroundColor: palette.accentStrong, paddingVertical: 18, borderRadius: radii.md, alignItems: 'center' }}
        >
          <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800' }}>Join on wavewarz.com</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/battle/
git commit -m "feat: battle detail screen with live pool ticker"
```

---

## Phase 8 - Town Square chat

### Task 8.1: sendMessage callable function

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/sendMessage.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/sendMessage.test.ts`

- [ ] **Step 1: Write the failing test**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/sendMessage.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateMessageInput, sanitizeText } from './sendMessage';

describe('validateMessageInput', () => {
  it('rejects empty text', () => {
    expect(() => validateMessageInput({ text: '   ' })).toThrow('text required');
  });
  it('rejects too long', () => {
    expect(() => validateMessageInput({ text: 'a'.repeat(241) })).toThrow('text too long');
  });
  it('accepts valid', () => {
    expect(validateMessageInput({ text: 'hello' })).toEqual({ text: 'hello' });
  });
});

describe('sanitizeText', () => {
  it('replaces profanity with asterisks', () => {
    const cleaned = sanitizeText('this is shit');
    expect(cleaned).not.toContain('shit');
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run sendMessage.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement sendMessage**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/sendMessage.ts`:
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Filter } from 'bad-words';

const filter = new Filter();
const RATE_LIMIT_MS = 3000;
const MAX_LEN = 240;

export const validateMessageInput = (input: { text?: unknown }): { text: string } => {
  if (typeof input.text !== 'string' || input.text.trim().length === 0) {
    throw new Error('text required');
  }
  if (input.text.length > MAX_LEN) throw new Error('text too long');
  return { text: input.text.trim() };
};

export const sanitizeText = (raw: string): string => filter.clean(raw);

export const sendMessage = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  let payload: { text: string };
  try {
    payload = validateMessageInput(request.data ?? {});
  } catch (err) {
    throw new HttpsError('invalid-argument', String((err as Error).message));
  }

  const db = admin.firestore();
  const uid = request.auth.uid;

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User doc missing');
  const user = userSnap.data() as { displayName: string };

  const recent = await db
    .collection('chat_global')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!recent.empty) {
    const last = recent.docs[0]?.data() as { createdAt: admin.firestore.Timestamp } | undefined;
    if (last && Date.now() - last.createdAt.toMillis() < RATE_LIMIT_MS) {
      throw new HttpsError('resource-exhausted', 'You can send one message every 3 seconds.');
    }
  }

  await db.collection('chat_global').add({
    uid,
    displayName: user.displayName,
    text: sanitizeText(payload.text),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  return { ok: true };
});
```

- [ ] **Step 4: Run tests, expect pass**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run sendMessage.test.ts
```
Expected: 4 pass.

- [ ] **Step 5: Export and deploy**

Edit `/Users/zaalpanthaki/Documents/wwapp/functions/src/index.ts` (already exports). Deploy:
```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:sendMessage --project dev
```

- [ ] **Step 6: Commit**

```bash
git add functions/src/sendMessage.ts functions/src/sendMessage.test.ts
git commit -m "feat: sendMessage callable with rate limit + profanity filter (TDD)"
```

### Task 8.2: Chat hook

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useChatMessages.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/services/chatClient.ts`

- [ ] **Step 1: Chat client wrapping callable**

Write `/Users/zaalpanthaki/Documents/wwapp/src/services/chatClient.ts`:
```ts
import { functions } from '@/services/firebase';

export const sendChatMessage = async (text: string): Promise<void> => {
  const callable = functions().httpsCallable('sendMessage');
  await callable({ text });
};
```

- [ ] **Step 2: Hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useChatMessages.ts`:
```ts
import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import type { ChatMessage } from '@/types/firestore';

export type ChatMessageWithId = ChatMessage & { id: string };

export const useChatMessages = (limit = 100) => {
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);

  useEffect(() => {
    const unsub = firestore()
      .collection('chat_global')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot((snap) => {
        setMessages(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as ChatMessage) }))
            .filter((m) => m.deletedAt === null),
        );
      });
    return unsub;
  }, [limit]);

  return messages;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/chatClient.ts src/hooks/useChatMessages.ts
git commit -m "feat: chat hook + send wrapper"
```

### Task 8.3: Chat screen

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/chat.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/components/ChatBubble.tsx`

- [ ] **Step 1: ChatBubble component**

Write `/Users/zaalpanthaki/Documents/wwapp/src/components/ChatBubble.tsx`:
```tsx
import { View, Text } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { ChatMessageWithId } from '@/hooks/useChatMessages';

interface Props {
  message: ChatMessageWithId;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: Props) => (
  <View style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: 4, marginBottom: spacing.md }}>
    {!isOwn ? (
      <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, marginLeft: 8 }}>{message.displayName}</Text>
    ) : null}
    <View
      style={{
        backgroundColor: isOwn ? palette.accentStrong : palette.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>{message.text}</Text>
    </View>
  </View>
);
```

- [ ] **Step 2: Chat screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/chat.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useChatMessages } from '@/hooks/useChatMessages';
import { sendChatMessage } from '@/services/chatClient';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ChatScreen() {
  const messages = useChatMessages();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      await sendChatMessage(trimmed);
      setText('');
    } catch (err) {
      Alert.alert('Could not send', String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
          Town Square
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.sm }}>
          Global chat. One message every 3 seconds.
        </Text>
      </View>

      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.xl }}
        renderItem={({ item }) => <ChatBubble message={item} isOwn={item.uid === user?.uid} />}
      />

      <View style={{ borderTopColor: palette.border, borderTopWidth: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: palette.card }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Say something..."
          placeholderTextColor={palette.textMuted}
          maxLength={240}
          multiline
          style={{
            backgroundColor: palette.surface,
            borderRadius: radii.md,
            borderColor: palette.border,
            borderWidth: 1,
            color: palette.textPrimary,
            padding: spacing.md,
            fontSize: fontSize.md,
            minHeight: 64,
            textAlignVertical: 'top',
          }}
        />
        <Pressable
          disabled={sending}
          onPress={handleSend}
          style={{ backgroundColor: palette.accentStrong, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', opacity: sending ? 0.7 : 1 }}
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>{sending ? 'Sending...' : 'Send'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/chat.tsx src/components/ChatBubble.tsx
git commit -m "feat: Town Square chat (global single room)"
```

---

## Phase 9 - Push notifications (FCM)

### Task 9.1: registerFcmToken callable

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/registerFcmToken.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/registerFcmToken.test.ts`

- [ ] **Step 1: Test**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/registerFcmToken.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { dedupAndCap } from './registerFcmToken';

describe('dedupAndCap', () => {
  it('dedups', () => {
    expect(dedupAndCap(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });
  it('caps at 5', () => {
    expect(dedupAndCap(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['b', 'c', 'd', 'e', 'f']);
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run registerFcmToken.test.ts
```

- [ ] **Step 3: Implement**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/registerFcmToken.ts`:
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const MAX_TOKENS = 5;

export const dedupAndCap = (tokens: string[]): string[] => {
  const unique = Array.from(new Set(tokens));
  return unique.slice(-MAX_TOKENS);
};

export const registerFcmToken = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const token = (request.data as { token?: string })?.token;
  if (!token) throw new HttpsError('invalid-argument', 'token required');

  const userRef = admin.firestore().collection('users').doc(request.auth.uid);
  await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const current = (snap.data()?.fcmTokens ?? []) as string[];
    tx.update(userRef, { fcmTokens: dedupAndCap([...current, token]) });
  });

  return { ok: true };
});
```

- [ ] **Step 4: Run tests, deploy**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run registerFcmToken.test.ts
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:registerFcmToken --project dev
```

- [ ] **Step 5: Commit**

```bash
git add functions/src/registerFcmToken.ts functions/src/registerFcmToken.test.ts
git commit -m "feat: registerFcmToken callable (TDD)"
```

### Task 9.2: subscribeToTopic callable

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/subscribeToTopic.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/subscribeToTopic.ts`:
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const inputSchema = z.object({
  topic: z.string().regex(/^(live|reminders|artist:[A-Za-z0-9]+)$/),
  subscribe: z.boolean(),
  token: z.string(),
});

export const subscribeToTopic = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);

  const { topic, subscribe, token } = parsed.data;
  if (subscribe) {
    await admin.messaging().subscribeToTopic([token], topic);
  } else {
    await admin.messaging().unsubscribeFromTopic([token], topic);
  }

  // Update artistFollows on user doc when artist topic changes
  if (topic.startsWith('artist:')) {
    const wallet = topic.split(':')[1] ?? '';
    const userRef = admin.firestore().collection('users').doc(request.auth.uid);
    if (subscribe) {
      await userRef.update({ 'notifPrefs.artistFollows': admin.firestore.FieldValue.arrayUnion(wallet) });
    } else {
      await userRef.update({ 'notifPrefs.artistFollows': admin.firestore.FieldValue.arrayRemove(wallet) });
    }
  }

  return { ok: true };
});
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:subscribeToTopic --project dev
git add functions/src/subscribeToTopic.ts
git commit -m "feat: subscribeToTopic callable"
```

### Task 9.3: App-side push registration

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/services/notifications.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useAuthBootstrap.ts`

- [ ] **Step 1: Notifications service**

Write `/Users/zaalpanthaki/Documents/wwapp/src/services/notifications.ts`:
```ts
import { messaging, functions } from './firebase';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Linking from 'expo-linking';

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
};

export const registerDeviceToken = async (): Promise<string | null> => {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;
  const token = await messaging().getToken();
  await functions().httpsCallable('registerFcmToken')({ token });
  return token;
};

export const subscribeDefaultTopics = async (token: string): Promise<void> => {
  await Promise.all([
    functions().httpsCallable('subscribeToTopic')({ topic: 'live', subscribe: true, token }),
    functions().httpsCallable('subscribeToTopic')({ topic: 'reminders', subscribe: true, token }),
  ]);
};

export const handlePushDeepLink = (data: Record<string, string>): void => {
  if (data.deepLink) Linking.openURL(data.deepLink);
};

export const setupForegroundHandler = (): (() => void) =>
  messaging().onMessage(async (msg) => {
    // Show in-app banner via toast - wired in Task 9.4
    console.log('foreground push', msg);
  });

export const setupBackgroundOpenHandler = (): (() => void) =>
  messaging().onNotificationOpenedApp((msg) => {
    if (msg?.data) handlePushDeepLink(msg.data as Record<string, string>);
  });
```

- [ ] **Step 2: Wire into bootstrap**

Edit `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useAuthBootstrap.ts` to add post-sign-in registration:
```ts
import { registerDeviceToken, subscribeDefaultTopics, setupForegroundHandler, setupBackgroundOpenHandler } from '@/services/notifications';
// ...
useEffect(() => {
  configureGoogle();
  const unsub = auth().onAuthStateChanged(async (user) => {
    setUser(user);
    setInitializing(false);
    if (user) {
      const token = await registerDeviceToken();
      if (token) await subscribeDefaultTopics(token);
    }
  });
  const unsubFg = setupForegroundHandler();
  const unsubBg = setupBackgroundOpenHandler();
  return () => { unsub(); unsubFg(); unsubBg(); };
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add src/services/notifications.ts src/hooks/useAuthBootstrap.ts
git commit -m "feat: register FCM token + subscribe default topics on sign-in"
```

### Task 9.4: Foreground toast banner

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/src/services/notifications.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx`

- [ ] **Step 1: Install toast**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add react-native-toast-message@^2.2.0
```

- [ ] **Step 2: Update notifications.ts to show toast on foreground**

Replace `setupForegroundHandler` body:
```ts
import Toast from 'react-native-toast-message';
// ...
export const setupForegroundHandler = (): (() => void) =>
  messaging().onMessage(async (msg) => {
    Toast.show({
      type: 'info',
      text1: msg.notification?.title ?? 'WaveWarZ',
      text2: msg.notification?.body ?? '',
      onPress: () => {
        if (msg.data) handlePushDeepLink(msg.data as Record<string, string>);
      },
    });
  });
```

- [ ] **Step 3: Mount Toast in root layout**

Edit `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx`, add `import Toast from 'react-native-toast-message';` and add `<Toast />` as last child inside `<SafeAreaProvider>`.

- [ ] **Step 4: Commit**

```bash
git add src/services/notifications.ts app/_layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: foreground push -> in-app toast"
```

### Task 9.5: onLiveStateChange Cloud Function (push fanout)

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/onLiveStateChange.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/onLiveStateChange.ts`:
```ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onLiveStateChange = onDocumentWritten(
  { document: 'app/liveState', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;
    const wasLive = before?.isLive === true;
    const nowLive = after.isLive === true;

    if (!wasLive && nowLive) {
      const battleId = after.currentBattleId ?? '';
      const deepLink = battleId ? `wavewarzlive://battle/${battleId}` : 'wavewarzlive://';
      await admin.messaging().send({
        topic: 'live',
        notification: {
          title: 'WaveWarZ is LIVE',
          body: 'A battle is happening right now. Tap to jump in.',
        },
        data: { type: 'live', battleId, deepLink },
        android: { priority: 'high', notification: { channelId: 'wavewarz-live', priority: 'max' } },
        apns: {
          payload: { aps: { sound: 'default', 'interruption-level': 'time-sensitive' } },
        },
      });
    }
  },
);
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:onLiveStateChange --project dev
git add functions/src/onLiveStateChange.ts
git commit -m "feat: onLiveStateChange fans out FCM push to topic live"
```

### Task 9.6: onBattleStarted (per-battle artist topic fanout)

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/onBattleStarted.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/onBattleStarted.ts`:
```ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onBattleStarted = onDocumentWritten(
  { document: 'battles/{battleId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;
    const wasUpcoming = before?.status === 'upcoming' || !before;
    const nowLive = after.status === 'live';
    if (!wasUpcoming || !nowLive) return;

    const battleId = event.params.battleId;
    const deepLink = `wavewarzlive://battle/${battleId}`;
    const baseMessage = {
      notification: { title: 'New battle started', body: `${after.artistAName} vs ${after.artistBName}` },
      data: { type: 'artist_battle', battleId, deepLink },
      android: { priority: 'high' as const, notification: { channelId: 'wavewarz-live' as const } },
      apns: { payload: { aps: { sound: 'default', 'interruption-level': 'time-sensitive' as const } } },
    };

    await Promise.all(
      [after.artistAWallet, after.artistBWallet]
        .filter(Boolean)
        .map((wallet) => admin.messaging().send({ ...baseMessage, topic: `artist:${wallet}` })),
    );
  },
);
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:onBattleStarted --project dev
git add functions/src/onBattleStarted.ts
git commit -m "feat: onBattleStarted pushes to per-artist topics"
```

---

## Phase 10 - Scraper, webhook, admin

### Task 10.1: Intelligence scraper module

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/scraper.ts`
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/scraper.test.ts`

- [ ] **Step 1: Test with fixture HTML**

Create fixture `/Users/zaalpanthaki/Documents/wwapp/functions/src/__fixtures__/leaderboard.html`:
- Save a snapshot of `https://wavewarz-intelligence.vercel.app/leaderboards/artists` HTML to that file.

Run:
```bash
mkdir -p /Users/zaalpanthaki/Documents/wwapp/functions/src/__fixtures__
curl -sL https://wavewarz-intelligence.vercel.app/leaderboards/artists -o /Users/zaalpanthaki/Documents/wwapp/functions/src/__fixtures__/leaderboard.html
```

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/scraper.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLeaderboard } from './scraper';

const html = readFileSync(join(__dirname, '__fixtures__/leaderboard.html'), 'utf8');

describe('parseLeaderboard', () => {
  it('parses at least 40 artists', () => {
    const artists = parseLeaderboard(html);
    expect(artists.length).toBeGreaterThanOrEqual(40);
  });
  it('each artist has name + record + volume', () => {
    const artists = parseLeaderboard(html);
    for (const a of artists) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(typeof a.wins).toBe('number');
      expect(typeof a.volumeSol).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run scraper.test.ts
```

- [ ] **Step 3: Implement parser**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/scraper.ts`:
```ts
import * as cheerio from 'cheerio';

export interface ParsedArtist {
  rank: number;
  wallet: string | null;
  name: string;
  twitterHandle: string | null;
  wins: number;
  losses: number;
  winRatePercent: number;
  volumeSol: number;
  earningsSol: number;
}

export const parseLeaderboard = (html: string): ParsedArtist[] => {
  const $ = cheerio.load(html);
  const rows = $('table tbody tr');
  const out: ParsedArtist[] = [];

  rows.each((idx, el) => {
    const $row = $(el);
    const cells = $row.find('td');
    if (cells.length < 5) return;

    const nameCell = $(cells[1]);
    const recordCell = $(cells[2]).text();
    const winRateCell = $(cells[3]).text();
    const volumeCell = $(cells[4]).text();
    const earningsCell = $(cells[5]).text();

    const name = nameCell.find('a').first().text().trim() || nameCell.text().trim();
    const handleAttr = nameCell.find('a').attr('href') ?? '';
    const walletMatch = handleAttr.match(/\/artist\/([A-Za-z0-9]+)/);
    const recordMatch = recordCell.match(/(\d+)W[^\d]+(\d+)L/);
    const winRateNum = parseFloat(winRateCell.replace('%', '').trim()) || 0;
    const volumeNum = parseFloat(volumeCell.replace(/[^\d.]/g, '')) || 0;
    const earningsNum = parseFloat(earningsCell.replace(/[^\d.]/g, '')) || 0;

    out.push({
      rank: idx + 1,
      wallet: walletMatch?.[1] ?? null,
      name,
      twitterHandle: null,
      wins: Number(recordMatch?.[1] ?? 0),
      losses: Number(recordMatch?.[2] ?? 0),
      winRatePercent: winRateNum,
      volumeSol: volumeNum,
      earningsSol: earningsNum,
    });
  });

  return out;
};
```

If the actual HTML structure differs from this assumed selector path, iterate by inspecting the saved fixture and adjusting selectors. Re-run the test until it passes.

- [ ] **Step 4: Pass tests**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run scraper.test.ts
```
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add functions/src/scraper.ts functions/src/scraper.test.ts functions/src/__fixtures__/leaderboard.html
git commit -m "feat: Intelligence dashboard leaderboard parser (TDD)"
```

### Task 10.2: syncIntelligence cron Cloud Function

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/syncIntelligence.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/syncIntelligence.ts`:
```ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { parseLeaderboard } from './scraper';

const INTELLIGENCE_BASE = 'https://wavewarz-intelligence.vercel.app';

export const syncIntelligence = onSchedule(
  { schedule: 'every 1 minutes', region: 'us-central1', timeoutSeconds: 60, memory: '512MiB' },
  async () => {
    const res = await fetch(`${INTELLIGENCE_BASE}/leaderboards/artists`);
    if (!res.ok) throw new Error(`Intelligence fetch failed: ${res.status}`);
    const html = await res.text();
    const artists = parseLeaderboard(html);

    const db = admin.firestore();
    const batch = db.batch();
    for (const a of artists) {
      if (!a.wallet) continue;
      batch.set(
        db.collection('artists').doc(a.wallet),
        {
          name: a.name,
          twitterHandle: a.twitterHandle,
          avatarUrl: null,
          wins: a.wins,
          losses: a.losses,
          winRatePercent: a.winRatePercent,
          volumeSol: a.volumeSol,
          earningsSol: a.earningsSol,
          spotlightTier: null,
          lastBattleAt: null,
        },
        { merge: true },
      );
    }
    await batch.commit();
  },
);
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:syncIntelligence --project dev
git add functions/src/syncIntelligence.ts
git commit -m "feat: 60s cron syncs Intelligence leaderboard to artists/"
```

### Task 10.3: liveWebhook Cloud Function

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/liveWebhook.ts`

- [ ] **Step 1: Set webhook secret config**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase functions:config:set wavewarz.webhook_secret="REPLACE_WITH_GENERATED_SECRET" --project dev
```

Generate a strong secret: `openssl rand -hex 32`. Use the same secret across staging + prod under their own configs.

- [ ] **Step 2: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/liveWebhook.ts`:
```ts
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const eventSchema = z.object({
  event: z.enum(['session.live', 'session.ended', 'battle.started', 'battle.settled']),
  occurredAt: z.string(),
  battleId: z.string().optional(),
  payload: z
    .object({
      artistAWallet: z.string().optional(),
      artistBWallet: z.string().optional(),
      artistAName: z.string().optional(),
      artistBName: z.string().optional(),
      songA: z.string().nullable().optional(),
      songB: z.string().nullable().optional(),
      joinUrl: z.string().optional(),
      xSpaceUrl: z.string().optional(),
    })
    .optional(),
});

export const liveWebhook = onRequest(
  { region: 'us-central1', secrets: ['WAVEWARZ_WEBHOOK_SECRET'] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }
    const auth = req.header('authorization') ?? '';
    const expected = `Bearer ${process.env.WAVEWARZ_WEBHOOK_SECRET}`;
    if (auth !== expected) {
      res.status(401).send('Unauthorized');
      return;
    }

    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { event, battleId, payload } = parsed.data;
    const db = admin.firestore();

    if (event === 'session.live' || event === 'session.ended') {
      await db.doc('app/liveState').set(
        {
          isLive: event === 'session.live',
          currentBattleId: battleId ?? null,
          xSpaceUrl: payload?.xSpaceUrl ?? null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'webhook',
        },
        { merge: true },
      );
    }

    if ((event === 'battle.started' || event === 'battle.settled') && battleId) {
      await db.doc(`battles/${battleId}`).set(
        {
          ...(payload ?? {}),
          status: event === 'battle.started' ? 'live' : 'settled',
          startedAt:
            event === 'battle.started'
              ? admin.firestore.FieldValue.serverTimestamp()
              : admin.firestore.FieldValue.delete(),
          settledAt:
            event === 'battle.settled' ? admin.firestore.FieldValue.serverTimestamp() : null,
        },
        { merge: true },
      );
    }

    res.json({ ok: true });
  },
);
```

- [ ] **Step 3: Provision the secret as a Function secret (v2 syntax)**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
echo "REPLACE_WITH_GENERATED_SECRET" | firebase functions:secrets:set WAVEWARZ_WEBHOOK_SECRET --project dev
```

- [ ] **Step 4: Deploy + commit**

```bash
firebase deploy --only functions:liveWebhook --project dev
git add functions/src/liveWebhook.ts
git commit -m "feat: liveWebhook receiver with bearer secret + zod validation"
```

### Task 10.4: adminFlipLive callable

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/adminFlipLive.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/adminFlipLive.ts`:
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const inputSchema = z.object({
  isLive: z.boolean(),
  currentBattleId: z.string().nullable().optional(),
  xSpaceUrl: z.string().url().nullable().optional(),
  scheduleNextIso: z.string().datetime().nullable().optional(),
});

export const adminFlipLive = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth?.token.email) throw new HttpsError('unauthenticated', 'Email required');
  const email = request.auth.token.email;
  const allowSnap = await admin.firestore().doc(`adminAllowlist/${email}`).get();
  if (!allowSnap.exists) throw new HttpsError('permission-denied', 'Not on admin allowlist');

  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  const { isLive, currentBattleId, xSpaceUrl, scheduleNextIso } = parsed.data;

  await admin.firestore().doc('app/liveState').set(
    {
      isLive,
      currentBattleId: currentBattleId ?? null,
      xSpaceUrl: xSpaceUrl ?? null,
      scheduleNext: scheduleNextIso ? admin.firestore.Timestamp.fromDate(new Date(scheduleNextIso)) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'admin',
    },
    { merge: true },
  );

  await admin.firestore().collection('adminLog').add({
    adminEmail: email,
    action: 'flipLive',
    payload: parsed.data,
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:adminFlipLive --project dev
git add functions/src/adminFlipLive.ts
git commit -m "feat: adminFlipLive callable with allowlist + audit log"
```

### Task 10.5: Admin screen

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/admin/live-toggle.tsx`

- [ ] **Step 1: Screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/admin/live-toggle.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { firestore, functions } from '@/services/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { palette, spacing, fontSize, radii } from '@/theme';

export default function AdminLiveToggle() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [battleId, setBattleId] = useState('');
  const [xSpaceUrl, setXSpaceUrl] = useState('');

  useEffect(() => {
    const check = async () => {
      if (!user?.email) { router.replace('/(tabs)'); return; }
      const snap = await firestore().doc(`adminAllowlist/${user.email}`).get();
      setAllowed(snap.exists);
      if (!snap.exists) router.replace('/(tabs)');
    };
    check();
  }, [user, router]);

  if (!allowed) return null;

  const flip = async (isLive: boolean) => {
    try {
      await functions().httpsCallable('adminFlipLive')({ isLive, currentBattleId: battleId || null, xSpaceUrl: xSpaceUrl || null });
      Alert.alert('Done', isLive ? 'Live state ON.' : 'Live state OFF.');
    } catch (err) {
      Alert.alert('Failed', String(err));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>
        Admin: Live toggle
      </Text>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: palette.textSecondary }}>Battle ID (optional)</Text>
        <TextInput value={battleId} onChangeText={setBattleId} placeholder="ww_battle_649" placeholderTextColor={palette.textMuted} style={{ backgroundColor: palette.surface, color: palette.textPrimary, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border }} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: palette.textSecondary }}>X Space URL (optional)</Text>
        <TextInput value={xSpaceUrl} onChangeText={setXSpaceUrl} autoCapitalize="none" placeholder="https://x.com/i/spaces/..." placeholderTextColor={palette.textMuted} style={{ backgroundColor: palette.surface, color: palette.textPrimary, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border }} />
      </View>

      <Pressable onPress={() => flip(true)} style={{ backgroundColor: palette.success, padding: spacing.lg, borderRadius: radii.md, alignItems: 'center' }}>
        <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: fontSize.md }}>GO LIVE</Text>
      </Pressable>
      <Pressable onPress={() => flip(false)} style={{ backgroundColor: palette.danger, padding: spacing.lg, borderRadius: radii.md, alignItems: 'center' }}>
        <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: fontSize.md }}>END LIVE</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Add Zaal's email to dev allowlist**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase firestore:set adminAllowlist/zaalp99@gmail.com '{"addedBy":"bootstrap","addedAt":"2026-05-05T00:00:00Z"}' --project dev
```

If the CLI does not have `firestore:set`, do this via the Console: https://console.firebase.google.com/project/wavewarzlive-dev/firestore -> create collection `adminAllowlist`, doc id `zaalp99@gmail.com`, fields `addedBy: "bootstrap"`, `addedAt: server timestamp`.

- [ ] **Step 3: Commit**

```bash
git add app/admin/
git commit -m "feat: admin live-toggle screen (allowlist gated)"
```

---

## Phase 11 - Artist profile + follow

### Task 11.1: useArtist hook

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useArtist.ts`

- [ ] **Step 1: Hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useArtist.ts`:
```ts
import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import type { Artist } from '@/types/firestore';

export const useArtist = (wallet: string | null) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  useEffect(() => {
    if (!wallet) return;
    const unsub = firestore()
      .doc(`artists/${wallet}`)
      .onSnapshot((snap) => setArtist((snap.data() as Artist | undefined) ?? null));
    return unsub;
  }, [wallet]);
  return artist;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useArtist.ts
git commit -m "feat: useArtist hook"
```

### Task 11.2: Artist screen

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/app/artist/[wallet].tsx`

- [ ] **Step 1: Screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/artist/[wallet].tsx`:
```tsx
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useArtist } from '@/hooks/useArtist';
import { palette, spacing, fontSize, radii } from '@/theme';
import { functions, messaging } from '@/services/firebase';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ArtistScreen() {
  const { wallet } = useLocalSearchParams<{ wallet: string }>();
  const router = useRouter();
  const artist = useArtist(wallet ?? null);
  const user = useAuthStore((s) => s.user);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    // TODO: read from user.notifPrefs.artistFollows; left for next pass
  }, [user]);

  const toggleFollow = async () => {
    if (!wallet) return;
    try {
      const token = await messaging().getToken();
      await functions().httpsCallable('subscribeToTopic')({ topic: `artist:${wallet}`, subscribe: !followed, token });
      setFollowed(!followed);
    } catch (err) {
      Alert.alert('Failed', String(err));
    }
  };

  if (!artist) {
    return <View style={{ flex: 1, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: palette.textMuted }}>Loading...</Text>
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Stack.Screen options={{ headerShown: true, title: artist.name, headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.textPrimary }} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.hero, fontWeight: '900', fontFamily: 'SpaceGrotesk-Black' }}>
          {artist.name}
        </Text>
        {artist.twitterHandle ? (
          <Text style={{ color: palette.accent, fontSize: fontSize.md }}>@{artist.twitterHandle}</Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          {[
            { label: 'Wins', value: String(artist.wins) },
            { label: 'Losses', value: String(artist.losses) },
            { label: 'Win %', value: `${artist.winRatePercent.toFixed(0)}%` },
            { label: 'Volume', value: `${artist.volumeSol.toFixed(2)} SOL` },
            { label: 'Earnings', value: `${artist.earningsSol.toFixed(3)} SOL` },
          ].map((stat) => (
            <View key={stat.label} style={{ backgroundColor: palette.card, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, minWidth: 100 }}>
              <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>{stat.label}</Text>
              <Text style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}>{stat.value}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={toggleFollow}
          style={{ backgroundColor: followed ? palette.surface : palette.accentStrong, padding: spacing.lg, borderRadius: radii.md, alignItems: 'center', borderWidth: 1, borderColor: palette.border }}
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>
            {followed ? 'Following - tap to unfollow' : 'Notify me on next battle'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/artist/
git commit -m "feat: artist profile screen + follow toggle"
```

---

## Phase 12 - Profile + Phantom wallet

### Task 12.1: Profile screen base

**Files:**
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/profile.tsx`
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useUserDoc.ts`

- [ ] **Step 1: useUserDoc hook**

Write `/Users/zaalpanthaki/Documents/wwapp/src/hooks/useUserDoc.ts`:
```ts
import { useEffect, useState } from 'react';
import { firestore } from '@/services/firebase';
import type { UserDoc } from '@/types/firestore';
import { useAuthStore } from '@/stores/useAuthStore';

export const useUserDoc = () => {
  const user = useAuthStore((s) => s.user);
  const [doc, setDoc] = useState<UserDoc | null>(null);
  useEffect(() => {
    if (!user) { setDoc(null); return; }
    const unsub = firestore()
      .doc(`users/${user.uid}`)
      .onSnapshot((snap) => setDoc((snap.data() as UserDoc | undefined) ?? null));
    return unsub;
  }, [user]);
  return doc;
};
```

- [ ] **Step 2: Profile screen**

Write `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/profile.tsx`:
```tsx
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useUserDoc } from '@/hooks/useUserDoc';
import { signOut } from '@/services/auth';

export default function ProfileScreen() {
  const userDoc = useUserDoc();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.xxl, fontWeight: '900', fontFamily: 'SpaceGrotesk-Bold' }}>Profile</Text>

      <View style={{ backgroundColor: palette.card, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.sm }}>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>Display name</Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}>{userDoc?.displayName ?? '...'}</Text>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>Email</Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>{userDoc?.email ?? '...'}</Text>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>Sign-in</Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>{userDoc?.providerIds?.join(', ') ?? '...'}</Text>
      </View>

      <View style={{ backgroundColor: palette.card, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.sm }}>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>Solana wallet</Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>
          {userDoc?.solanaWallet ?? 'Not connected (Phantom connect coming next task)'}
        </Text>
      </View>

      <Pressable
        onPress={async () => { try { await signOut(); } catch (err) { Alert.alert('Sign out failed', String(err)); } }}
        style={{ backgroundColor: palette.danger, padding: spacing.md, borderRadius: radii.md, alignItems: 'center' }}
      >
        <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/profile.tsx src/hooks/useUserDoc.ts
git commit -m "feat: profile screen with user doc + sign-out"
```

### Task 12.2: connectWallet callable

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/functions/src/connectWallet.ts`

- [ ] **Step 1: Implementation**

Write `/Users/zaalpanthaki/Documents/wwapp/functions/src/connectWallet.ts`:
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { z } from 'zod';

const inputSchema = z.object({
  publicKey: z.string(),
  signature: z.string(),  // base58
  challenge: z.string(),  // utf8 message that was signed
});

export const connectWallet = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const parsed = inputSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);

  const { publicKey, signature, challenge } = parsed.data;

  const pubKeyBytes = bs58.decode(publicKey);
  const sigBytes = bs58.decode(signature);
  const msgBytes = new TextEncoder().encode(challenge);

  const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
  if (!valid) throw new HttpsError('permission-denied', 'Signature invalid');

  const db = admin.firestore();
  const userRef = db.collection('users').doc(request.auth.uid);
  const artistSnap = await db.doc(`artists/${publicKey}`).get();
  await userRef.update({
    solanaWallet: publicKey,
    isWaveWarZArtist: artistSnap.exists,
  });

  return { ok: true, isWaveWarZArtist: artistSnap.exists };
});
```

- [ ] **Step 2: Deploy + commit**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
firebase deploy --only functions:connectWallet --project dev
git add functions/src/connectWallet.ts
git commit -m "feat: connectWallet verifies Phantom sig and links wallet"
```

### Task 12.3: Phantom deeplink flow

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/services/phantom.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/profile.tsx`

- [ ] **Step 1: Phantom service**

Write `/Users/zaalpanthaki/Documents/wwapp/src/services/phantom.ts`:
```ts
import * as Linking from 'expo-linking';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { functions } from './firebase';
import { env } from '@/config/env';

export interface PhantomConnectResult {
  publicKey: string;
  signature: string;
  challenge: string;
}

const APP_URL = `https://${env.phantomReturnHost}/phantom-return`;

export const buildConnectUrl = (challenge: string): string => {
  const params = new URLSearchParams({
    app_url: APP_URL,
    redirect_link: 'wavewarzlive://phantom-callback',
    cluster: 'mainnet-beta',
  });
  return `https://phantom.app/ul/v1/connect?${params.toString()}&challenge=${encodeURIComponent(challenge)}`;
};

export const issueChallenge = (uid: string): string => {
  const nonce = bs58.encode(nacl.randomBytes(16));
  return `WaveWarZ Live wallet link\nuid:${uid}\nnonce:${nonce}\nts:${Date.now()}`;
};

export const persistWallet = async (params: PhantomConnectResult): Promise<{ isWaveWarZArtist: boolean }> => {
  const callable = functions().httpsCallable('connectWallet');
  const res = await callable(params);
  return res.data as { isWaveWarZArtist: boolean };
};

export const startPhantomConnect = async (uid: string): Promise<string> => {
  const challenge = issueChallenge(uid);
  await Linking.openURL(buildConnectUrl(challenge));
  return challenge;
};
```

- [ ] **Step 2: Wire deeplink listener for callback**

Edit `/Users/zaalpanthaki/Documents/wwapp/src/services/phantom.ts` to add a parser:
```ts
export const parsePhantomCallback = (url: string): { publicKey: string; signature: string } | null => {
  const parsed = Linking.parse(url);
  const pk = (parsed.queryParams?.public_key ?? parsed.queryParams?.publicKey) as string | undefined;
  const sig = (parsed.queryParams?.signature ?? parsed.queryParams?.sig) as string | undefined;
  if (!pk || !sig) return null;
  return { publicKey: pk, signature: sig };
};
```

- [ ] **Step 3: Add Connect Phantom button to profile**

In `/Users/zaalpanthaki/Documents/wwapp/app/(tabs)/profile.tsx`, replace the "Solana wallet" card body with a Connect button when not connected:
```tsx
import { useEffect, useState } from 'react';
import { startPhantomConnect, parsePhantomCallback, persistWallet } from '@/services/phantom';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/stores/useAuthStore';

// Inside component:
const user = useAuthStore((s) => s.user);
const [pendingChallenge, setPendingChallenge] = useState<string | null>(null);

useEffect(() => {
  const sub = Linking.addEventListener('url', async ({ url }) => {
    const parsed = parsePhantomCallback(url);
    if (parsed && pendingChallenge) {
      try {
        await persistWallet({ ...parsed, challenge: pendingChallenge });
        setPendingChallenge(null);
        Alert.alert('Wallet connected');
      } catch (err) {
        Alert.alert('Wallet connect failed', String(err));
      }
    }
  });
  return () => sub.remove();
}, [pendingChallenge]);

const handleConnect = async () => {
  if (!user) return;
  const challenge = await startPhantomConnect(user.uid);
  setPendingChallenge(challenge);
};

// In the wallet card JSX, render a Pressable when no wallet:
{!userDoc?.solanaWallet ? (
  <Pressable onPress={handleConnect} style={{ backgroundColor: palette.accentStrong, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.sm }}>
    <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>Connect Phantom</Text>
  </Pressable>
) : null}
```

- [ ] **Step 4: Install bs58 + tweetnacl**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add bs58@^6.0.0 tweetnacl@^1.0.3
```

- [ ] **Step 5: Commit**

```bash
git add src/services/phantom.ts app/(tabs)/profile.tsx package.json pnpm-lock.yaml
git commit -m "feat: Phantom wallet connect via deeplink + sig verify"
```

---

## Phase 13 - Observability

### Task 13.1: Sentry init

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/lib/sentry.ts`
- Modify: `/Users/zaalpanthaki/Documents/wwapp/app/_layout.tsx`

- [ ] **Step 1: Install Sentry**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm add @sentry/react-native@~6.4.0
pnpm exec expo install --fix
```

- [ ] **Step 2: Sentry init module**

Write `/Users/zaalpanthaki/Documents/wwapp/src/lib/sentry.ts`:
```ts
import * as Sentry from '@sentry/react-native';
import { env } from '@/config/env';

export const initSentry = (): void => {
  if (!env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
  });
};
```

- [ ] **Step 3: Call from root layout**

Edit root layout to call `initSentry()` once outside the component (top-level statement).

- [ ] **Step 4: Commit**

```bash
git add src/lib/sentry.ts app/_layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: Sentry init for JS errors"
```

### Task 13.2: Analytics events

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/src/lib/analytics.ts`

- [ ] **Step 1: Helper**

Write `/Users/zaalpanthaki/Documents/wwapp/src/lib/analytics.ts`:
```ts
import { analytics } from '@/services/firebase';

type EventName =
  | 'app_open'
  | 'signin_success'
  | 'push_received'
  | 'push_opened'
  | 'join_battle_tapped'
  | 'chat_sent'
  | 'wallet_connected'
  | 'artist_follow_added';

export const track = (event: EventName, params?: Record<string, string | number>): void => {
  void analytics().logEvent(event, params);
};
```

- [ ] **Step 2: Sprinkle calls**

Add `track('signin_success', { provider: 'apple' })` after each sign-in success in `auth.ts`. Add `track('chat_sent')` after `sendChatMessage` resolves. Add `track('join_battle_tapped', { battleId })` in BattleCard onPress and battle detail Join button. Add `track('wallet_connected')` after `persistWallet` resolves. Add `track('artist_follow_added', { wallet })` in artist follow toggle.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics.ts src/services/auth.ts src/services/chatClient.ts src/components/BattleCard.tsx app/battle src/services/phantom.ts app/artist
git commit -m "feat: analytics events for key actions"
```

---

## Phase 14 - Build, EAS, ship

### Task 14.1: EAS init

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/eas.json`

- [ ] **Step 1: Init EAS**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
eas init
```
Expected: prompts to create or link an EAS project. Choose "create new" if first time. Updates `app.json` `extra.eas.projectId`.

- [ ] **Step 2: Write eas.json**

Write `/Users/zaalpanthaki/Documents/wwapp/eas.json`:
```json
{
  "cli": { "version": ">= 13.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "dev",
      "env": {
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "wavewarzlive-dev",
        "EXPO_PUBLIC_FIREBASE_REGION": "us-central1"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "staging",
      "env": {
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "wavewarzlive-staging"
      }
    },
    "production": {
      "channel": "production",
      "env": {
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "wavewarzlive-prod"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add eas.json app.json
git commit -m "chore: EAS Build profiles for dev/preview/production"
```

### Task 14.2: First dev build

**Files:** none (CI work)

- [ ] **Step 1: Build dev client for iOS simulator**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
eas build --profile development --platform ios --local
```
Expected: a `.app` archive at `build-output/`. Install in simulator via:
```bash
xcrun simctl install booted build-output/path/to/WaveWarZLive.app
```

If `--local` is unavailable on the runner machine, run without it for cloud build (slower, uses EAS credits).

- [ ] **Step 2: Build dev client for Android**

```bash
eas build --profile development --platform android --local
```

- [ ] **Step 3: Smoke test sign-in + push**

Manual: launch on simulator + emulator. Sign in with email magic link. Verify user doc created in Firestore Console. Trigger admin "GO LIVE" via the screen and confirm push lands on a real iOS test device (simulator does not receive remote push).

- [ ] **Step 4: Commit notes file**

```bash
echo "Initial dev build smoke checklist" > docs/ship-notes.md
echo "- [x] Email sign-in" >> docs/ship-notes.md
echo "- [ ] Apple sign-in (real device)" >> docs/ship-notes.md
echo "- [ ] Google sign-in" >> docs/ship-notes.md
echo "- [ ] Push received (real iOS device)" >> docs/ship-notes.md
echo "- [ ] Phantom connect" >> docs/ship-notes.md
git add docs/ship-notes.md
git commit -m "docs: ship-notes smoke checklist"
```

### Task 14.3: E2E baseline with Maestro

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/maestro/sign-in.yaml`
- Create: `/Users/zaalpanthaki/Documents/wwapp/maestro/chat-send.yaml`

- [ ] **Step 1: Sign-in flow**

Write `/Users/zaalpanthaki/Documents/wwapp/maestro/sign-in.yaml`:
```yaml
appId: com.wavewarz.live.dev
---
- launchApp:
    clearState: true
- assertVisible: "Don't miss a battle."
- tapOn: "Sign in to get alerts"
- assertVisible: "Sign in"
- tapOn:
    id: "you@example.com"
- inputText: "qa+wwlive@example.com"
- tapOn: "Email me a sign-in link"
- assertVisible: "Check your email"
```

- [ ] **Step 2: Chat send flow** (depends on a pre-signed-in state, run after sign-in)

Write `/Users/zaalpanthaki/Documents/wwapp/maestro/chat-send.yaml`:
```yaml
appId: com.wavewarz.live.dev
---
- launchApp
- tapOn: "Town Square"
- assertVisible: "Town Square"
- tapOn: "Say something..."
- inputText: "Hello from Maestro"
- tapOn: "Send"
- assertVisible: "Hello from Maestro"
```

- [ ] **Step 3: Run flows**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
maestro test maestro/sign-in.yaml
maestro test maestro/chat-send.yaml
```
Expected: green for both. If sign-in flow blocks on email link (it will - that's expected), assertion stops at "Check your email" which is fine.

- [ ] **Step 4: Commit**

```bash
git add maestro/
git commit -m "test: Maestro E2E flows for sign-in + chat"
```

---

## Phase 15 - Final polish

### Task 15.1: Strip emojis sweep

Per Zaal's global rule: zero emojis in UI strings, copy, push payloads.

- [ ] **Step 1: Search for any stray emoji codepoints**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
grep -rEn '[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]' app src functions || echo "no emojis found"
```
Expected: "no emojis found." If any matches, replace with text labels and re-commit.

- [ ] **Step 2: Commit if changes were needed**

```bash
git add -A
git commit -m "chore: strip stray emojis"
```

### Task 15.2: Final type check + lint + tests

- [ ] **Step 1: Type check**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
pnpm exec tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 2: Lint**

```bash
pnpm exec eslint app src
```
Expected: zero errors.

- [ ] **Step 3: Functions tests**

```bash
cd /Users/zaalpanthaki/Documents/wwapp/functions
pnpm exec vitest run
```
Expected: all tests pass.

- [ ] **Step 4: Commit if changes**

```bash
cd /Users/zaalpanthaki/Documents/wwapp
git status
```
If clean, no commit needed. If lint or types found issues fixed inline, commit them with `chore: lint + type fixes`.

### Task 15.3: README

**Files:**
- Create: `/Users/zaalpanthaki/Documents/wwapp/README.md`

- [ ] **Step 1: Write README**

Write `/Users/zaalpanthaki/Documents/wwapp/README.md`:
```markdown
# WaveWarZ Live

Cross-platform mobile app for real-time alerts and spectating of WaveWarZ Solana music trading battles. Officially sanctioned companion app.

## Architecture

See `docs/superpowers/specs/2026-05-05-wavewarz-live-design.md` for the full design spec and `docs/superpowers/plans/2026-05-05-wavewarz-live.md` for implementation history.

## Run

```
pnpm install
cp .env.example .env  # fill in
pnpm exec expo start --dev-client
```

A dev client build is needed (native modules). Build via:
```
eas build --profile development --platform ios --local
eas build --profile development --platform android --local
```

## Environments

- dev: `wavewarzlive-dev` Firebase project, EAS channel `dev`
- staging: `wavewarzlive-staging`, channel `staging`
- prod: `wavewarzlive-prod`, channel `production`

## Cloud Functions

```
cd functions
pnpm exec vitest run     # run tests
firebase deploy --only functions --project dev
```

## License

All rights reserved. Operates under official WaveWarZ partnership.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README"
```

---

## Self-Review Notes

Spec coverage cross-check (each section in `2026-05-05-wavewarz-live-design.md` mapped to tasks):

| Spec section | Tasks |
|---|---|
| 4.1 Stack | Phase 0, Phase 1, Phase 2 |
| 4.2 Data layers | Task 10.2 (scrape -> Firestore), Task 6.1 (app reads) |
| 4.3 Firestore schema | Task 3.3 (types), Task 3.1 (rules), Task 3.2 (indexes) |
| 4.4 Cloud Functions | Tasks 5.5, 8.1, 9.1, 9.2, 9.5, 9.6, 10.1-10.4, 12.2 |
| 4.5 Webhook contract | Task 10.3 |
| 4.6 Hosting / envs | Task 2.1, Task 14.1 |
| 5 Navigation | Task 4.2, Task 4.3 |
| 6 Screens | Tasks 6.3, 7.3, 7.4, 8.3, 11.2, 12.1, 10.5 |
| 7 Auth flow | Tasks 5.1-5.5 |
| 8 Notifications | Tasks 9.1-9.6 |
| 9 Wallet | Tasks 12.2, 12.3 |
| 10 Error handling | Distributed across screens; Sentry/Crashlytics in 13.1 |
| 11 Testing | Tasks 5.5, 8.1, 9.1, 10.1, 14.3 |
| 12 Observability | Tasks 13.1, 13.2 |
| 13 Visual direction | Phase 1 (theme), Phase 4-12 (each screen) |
| 14 App Store | Task 14.1 (eas.json), Task 0.4 (entitlements) - submission Phase post-V1 |
| 15 V1 vs V2 | V1 only in this plan; V2 items deferred |
| 16 Hurricane asks | Captured in spec; no plan task |
| 17 Out of scope | Honored throughout |
| 18 Risks | Mitigations live in tasks (Cloud Monitoring not yet a task - see followup) |
| 19 Success criteria | Validated via Task 14.2 smoke + Maestro 14.3 |

Followups intentionally deferred:
- Cloud Monitoring alerts on scraper failures (3-in-a-row email) - 30-min task post-V1.
- Crashlytics dashboard configuration - manual Console work, not file changes.
- Apple App Site Association + Android assetlinks file hosting - blocked on `live.wavewarz.com` DNS from Hurricane (spec section 16 ask 5).

---

## Execution

Plan complete and saved to `/Users/zaalpanthaki/Documents/wwapp/docs/superpowers/plans/2026-05-05-wavewarz-live.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans skill, batch execution with checkpoints.

Which approach?
