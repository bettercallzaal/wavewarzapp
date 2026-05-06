import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { Battle } from '@/types/firestore';
import { ArtistAvatar } from './ArtistAvatar';
import { PoolBar } from './PoolBar';

const STATUS_COLOR: Record<Battle['status'], string> = {
  live: palette.success,
  upcoming: palette.warning,
  settled: palette.textMuted,
};

const STATUS_LABEL: Record<Battle['status'], string> = {
  live: 'LIVE',
  upcoming: 'UPCOMING',
  settled: 'SETTLED',
};

interface Props {
  battle: Battle;
}

export const BattleCard = ({ battle }: Props) => {
  const router = useRouter();
  const total = battle.poolASol + battle.poolBSol;

  return (
    <Pressable
      onPress={() => router.push(`/battle/${battle.id}`)}
      style={({ pressed }) => ({
        backgroundColor: palette.card,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.lg,
        gap: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {battle.status === 'live' ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: palette.success,
              }}
            />
          ) : null}
          <Text
            style={{
              color: STATUS_COLOR[battle.status],
              fontSize: fontSize.xs,
              fontWeight: '900',
              letterSpacing: 0.5,
            }}
          >
            {STATUS_LABEL[battle.status]}
          </Text>
          <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>
            {battle.type.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.sm }}>
          {total > 0 ? `${total.toFixed(2)} SOL` : 'Pool opens at start'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <ArtistAvatar name={battle.artistAName} size={44} />
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800' }}
            numberOfLines={1}
          >
            {battle.artistAName}
          </Text>
          {battle.songA ? (
            <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
              {battle.songA}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: palette.textMuted, fontWeight: '900' }}>vs</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text
            style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '800' }}
            numberOfLines={1}
          >
            {battle.artistBName}
          </Text>
          {battle.songB ? (
            <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
              {battle.songB}
            </Text>
          ) : null}
        </View>
        <ArtistAvatar name={battle.artistBName} size={44} />
      </View>

      {battle.status !== 'upcoming' ? (
        <PoolBar poolASol={battle.poolASol} poolBSol={battle.poolBSol} />
      ) : null}
    </Pressable>
  );
};
