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
