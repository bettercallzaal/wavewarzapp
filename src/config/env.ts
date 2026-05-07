const optional = (key: string, fallback: string): string => process.env[key] ?? fallback;

const optionalNullable = (key: string): string | null => process.env[key] ?? null;

export const env = {
  // Firebase (optional in demo phase - required when wiring real backend)
  firebaseProjectId: optionalNullable('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  firebaseRegion: optional('EXPO_PUBLIC_FIREBASE_REGION', 'us-central1'),
  // Public sources
  joinBattleUrl: optional('EXPO_PUBLIC_JOIN_BATTLE_URL', 'https://wavewarz.com'),
  intelligenceBase: optional(
    'EXPO_PUBLIC_INTELLIGENCE_BASE',
    'https://wavewarz-intelligence.vercel.app',
  ),
  sentryDsn: optionalNullable('EXPO_PUBLIC_SENTRY_DSN'),
  phantomReturnHost: optional('EXPO_PUBLIC_PHANTOM_DEEPLINK_RETURN_HOST', 'live.wavewarz.com'),
} as const;

export const isFirebaseConfigured = (): boolean => env.firebaseProjectId !== null;
