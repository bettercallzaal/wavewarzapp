import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useBattle } from '@/hooks/useBattle';
import { ArtistAvatar } from '@/components/ArtistAvatar';
import { PoolBar } from '@/components/PoolBar';
import { PrimaryButton } from '@/components/PrimaryButton';

const STATUS_TINT: Record<string, string> = {
  live: palette.success,
  upcoming: palette.warning,
  settled: palette.textMuted,
};

export default function BattleDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const battle = useBattle(params.id ?? null);

  if (!battle) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: palette.textMuted, fontSize: fontSize.md }}>Battle not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: palette.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const totalPool = battle.poolASol + battle.poolBSol;
  const winnerName =
    battle.winner === 'a' ? battle.artistAName : battle.winner === 'b' ? battle.artistBName : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerShadowVisible: false,
          headerTintColor: palette.textPrimary,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              backgroundColor: STATUS_TINT[battle.status] + '33',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.pill,
            }}
          >
            <Text
              style={{
                color: STATUS_TINT[battle.status],
                fontWeight: '900',
                fontSize: fontSize.xs,
                letterSpacing: 0.5,
              }}
            >
              {battle.status.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
            {battle.type.toUpperCase()} BATTLE
          </Text>
        </View>

        <Text
          style={{
            color: palette.textPrimary,
            fontSize: fontSize.hero,
            fontWeight: '900',
            lineHeight: 42,
            fontFamily: 'SpaceGrotesk-Bold',
          }}
        >
          {battle.artistAName}{'\n'}vs {battle.artistBName}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.push(`/artist/${battle.artistAWallet}`)}
            style={{ alignItems: 'center', flex: 1, gap: spacing.sm }}
          >
            <ArtistAvatar name={battle.artistAName} size={88} />
            <Text style={{ color: palette.textPrimary, fontWeight: '800' }} numberOfLines={1}>
              {battle.artistAName}
            </Text>
            {battle.songA ? (
              <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                {battle.songA}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push(`/artist/${battle.artistBWallet}`)}
            style={{ alignItems: 'center', flex: 1, gap: spacing.sm }}
          >
            <ArtistAvatar name={battle.artistBName} size={88} />
            <Text style={{ color: palette.textPrimary, fontWeight: '800' }} numberOfLines={1}>
              {battle.artistBName}
            </Text>
            {battle.songB ? (
              <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                {battle.songB}
              </Text>
            ) : null}
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: palette.card,
            padding: spacing.lg,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: palette.border,
            gap: spacing.md,
          }}
        >
          <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
            POOL
          </Text>
          <Text
            style={{
              color: palette.textPrimary,
              fontSize: fontSize.xxl,
              fontWeight: '900',
              fontFamily: 'SpaceGrotesk-Bold',
            }}
          >
            {totalPool.toFixed(2)} SOL
          </Text>
          <PoolBar
            poolASol={battle.poolASol}
            poolBSol={battle.poolBSol}
            labelA={battle.artistAName.split(/[\s:]+/)[0] ?? ''}
            labelB={battle.artistBName.split(/[\s:]+/)[0] ?? ''}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: palette.textPrimary, fontSize: fontSize.sm }}>
              {battle.poolASol.toFixed(2)} SOL on {battle.artistAName}
            </Text>
            <Text style={{ color: palette.textPrimary, fontSize: fontSize.sm }}>
              {battle.poolBSol.toFixed(2)} SOL on {battle.artistBName}
            </Text>
          </View>
        </View>

        {winnerName ? (
          <View
            style={{
              backgroundColor: palette.successDim,
              borderRadius: radii.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: palette.success,
            }}
          >
            <Text style={{ color: palette.success, fontWeight: '900', fontSize: fontSize.xs }}>
              WINNER
            </Text>
            <Text
              style={{
                color: palette.textPrimary,
                fontSize: fontSize.lg,
                fontWeight: '800',
                marginTop: 4,
              }}
            >
              {winnerName}
            </Text>
          </View>
        ) : null}

        {battle.status !== 'settled' ? (
          <PrimaryButton
            label={battle.status === 'live' ? 'Join the Battle' : 'Open wavewarz.com'}
            onPress={() => Linking.openURL(battle.joinUrl)}
            variant={battle.status === 'live' ? 'primary' : 'secondary'}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
