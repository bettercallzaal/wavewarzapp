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
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}
