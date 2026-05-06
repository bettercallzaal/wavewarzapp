import { View, Text } from 'react-native';
import { palette, fontSize } from '@/theme';

export default function LiveScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.background,
      }}
    >
      <Text
        style={{
          color: palette.textPrimary,
          fontSize: fontSize.xxl,
          fontFamily: 'SpaceGrotesk-Bold',
        }}
      >
        Live
      </Text>
      <Text style={{ color: palette.textMuted, marginTop: 8 }}>Status card lands next task.</Text>
    </View>
  );
}
