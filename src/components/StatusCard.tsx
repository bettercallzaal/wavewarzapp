import { View, Text } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { LiveState } from '@/types/firestore';

const formatNext = (next: LiveState['scheduleNext']): string => {
  if (!next) return 'Mon-Fri 8:30PM EST. Sunday feature 7PM EST.';
  const date = next.toDate();
  return date.toLocaleString('en-US', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

interface Props {
  state: LiveState;
  activeBattlesCount?: number;
}

export const StatusCard = ({ state, activeBattlesCount = 0 }: Props) => {
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
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isLive ? palette.success : palette.danger,
          }}
        />
        <Text
          style={{
            color: palette.textPrimary,
            fontSize: fontSize.xs,
            fontWeight: '900',
            letterSpacing: 0.6,
          }}
        >
          {isLive ? 'LIVE NOW' : 'OFFLINE'}
        </Text>
      </View>

      <Text
        style={{
          color: palette.textPrimary,
          fontSize: fontSize.xl,
          fontWeight: '900',
          fontFamily: 'SpaceGrotesk-Bold',
        }}
      >
        {isLive ? 'A battle is happening right now' : 'Stay ready for the next session'}
      </Text>

      <Text style={{ color: palette.textSecondary, fontSize: fontSize.md, lineHeight: 22 }}>
        {isLive
          ? `${activeBattlesCount} active battle${activeBattlesCount === 1 ? '' : 's'}`
          : `Next: ${formatNext(state.scheduleNext)}`}
      </Text>

      {!isLive ? (
        <Text style={{ color: palette.warning, fontSize: fontSize.sm, fontWeight: '700' }}>
          Turn on notifications so you do not miss it.
        </Text>
      ) : null}
    </View>
  );
};
