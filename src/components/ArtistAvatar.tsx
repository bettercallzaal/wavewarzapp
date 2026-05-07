import { View, Text } from 'react-native';
import { palette, radii } from '@/theme';

const initials = (name: string): string => {
  const parts = name
    .trim()
    .replace(/^\$/, '')
    .split(/[\s:]+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const word = parts[0] ?? '';
    return word.slice(0, 2).toUpperCase();
  }
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

const hue = (seed: string): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
};

interface Props {
  name: string;
  size?: number;
}

export const ArtistAvatar = ({ name, size = 48 }: Props) => {
  const h = hue(name);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.pill,
        backgroundColor: `hsl(${h}, 65%, 35%)`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text
        style={{
          color: palette.textPrimary,
          fontSize: size * 0.38,
          fontWeight: '900',
          fontFamily: 'SpaceGrotesk-Bold',
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
};
