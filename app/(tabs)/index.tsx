import { ScrollView, View, Text, Linking, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, fontSize, radii } from '@/theme';
import { StatusCard } from '@/components/StatusCard';
import { PoolBar } from '@/components/PoolBar';
import { ArtistAvatar } from '@/components/ArtistAvatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useLiveState } from '@/hooks/useLiveState';
import { useBattle } from '@/hooks/useBattle';
import { useBattles } from '@/hooks/useBattles';
import { useArtists } from '@/hooks/useArtists';
import { env } from '@/config/env';
import { setLiveStateDemo } from '@/services/liveState';

export default function LiveScreen() {
  const router = useRouter();
  const live = useLiveState();
  const liveBattles = useBattles('live');
  const settled = useBattles('settled');
  const artists = useArtists();

  const currentBattle = useBattle(live.currentBattleId);
  const lastSettled = settled[0] ?? null;
  const top3 = artists.slice(0, 3);

  const handleJoin = async () => {
    const target = currentBattle?.joinUrl ?? env.joinBattleUrl;
    await Linking.openURL(target);
  };

  const handleOpenSpace = async () => {
    if (live.xSpaceUrl) await Linking.openURL(live.xSpaceUrl);
  };

  const toggleLive = () => {
    setLiveStateDemo({ isLive: !live.isLive });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xl }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text
          style={{
            color: palette.accentStrong,
            fontSize: fontSize.xs,
            fontWeight: '900',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
        >
          WaveWarZ Live
        </Text>
        <Text
          style={{
            color: palette.textPrimary,
            fontSize: fontSize.hero,
            fontWeight: '900',
            lineHeight: 42,
            fontFamily: 'SpaceGrotesk-Bold',
          }}
        >
          Battle alerts the moment they hit.
        </Text>
      </View>

      <StatusCard state={live} activeBattlesCount={liveBattles.length} />

      {currentBattle ? (
        <Pressable
          onPress={() => router.push(`/battle/${currentBattle.id}`)}
          style={{
            backgroundColor: palette.card,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <Text
            style={{
              color: palette.textMuted,
              fontSize: fontSize.xs,
              fontWeight: '900',
              letterSpacing: 0.5,
            }}
          >
            CURRENT BATTLE
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, alignItems: 'flex-start', gap: 6 }}>
              <ArtistAvatar name={currentBattle.artistAName} size={56} />
              <Text
                style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}
                numberOfLines={1}
              >
                {currentBattle.artistAName}
              </Text>
              {currentBattle.songA ? (
                <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                  {currentBattle.songA}
                </Text>
              ) : null}
            </View>

            <Text style={{ color: palette.textMuted, fontWeight: '900', fontSize: fontSize.lg }}>
              vs
            </Text>

            <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
              <ArtistAvatar name={currentBattle.artistBName} size={56} />
              <Text
                style={{ color: palette.textPrimary, fontSize: fontSize.lg, fontWeight: '800' }}
                numberOfLines={1}
              >
                {currentBattle.artistBName}
              </Text>
              {currentBattle.songB ? (
                <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }} numberOfLines={1}>
                  {currentBattle.songB}
                </Text>
              ) : null}
            </View>
          </View>

          <PoolBar
            poolASol={currentBattle.poolASol}
            poolBSol={currentBattle.poolBSol}
            labelA={currentBattle.artistAName.split(/[\s:]+/)[0] ?? ''}
            labelB={currentBattle.artistBName.split(/[\s:]+/)[0] ?? ''}
          />
        </Pressable>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <PrimaryButton
          label={live.isLive ? 'Join the Battle' : 'Open wavewarz.com'}
          onPress={handleJoin}
          variant={live.isLive ? 'primary' : 'secondary'}
        />
        {live.isLive && live.xSpaceUrl ? (
          <PrimaryButton label="Open X Space" onPress={handleOpenSpace} variant="secondary" />
        ) : null}
      </View>

      {lastSettled ? (
        <Pressable
          onPress={() => router.push(`/battle/${lastSettled.id}`)}
          style={{
            backgroundColor: palette.surface,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            gap: 4,
          }}
        >
          <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
            LAST RESULT
          </Text>
          <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, fontWeight: '700' }}>
            {lastSettled.winner === 'a' ? lastSettled.artistAName : lastSettled.artistBName} won vs{' '}
            {lastSettled.winner === 'a' ? lastSettled.artistBName : lastSettled.artistAName}
          </Text>
        </Pressable>
      ) : null}

      {top3.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text
            style={{
              color: palette.textMuted,
              fontSize: fontSize.xs,
              fontWeight: '900',
              letterSpacing: 0.5,
            }}
          >
            TOP THIS WEEK
          </Text>
          {top3.map((artist, idx) => (
            <Pressable
              key={artist.wallet}
              onPress={() => router.push(`/artist/${artist.wallet}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: palette.card,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text
                style={{
                  color: palette.accentStrong,
                  fontWeight: '900',
                  fontSize: fontSize.md,
                  width: 24,
                }}
              >
                {idx + 1}
              </Text>
              <ArtistAvatar name={artist.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.textPrimary, fontWeight: '800' }} numberOfLines={1}>
                  {artist.name}
                </Text>
                <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>
                  {artist.wins}W-{artist.losses}L · {artist.winRatePercent}% ·{' '}
                  {artist.volumeSol.toFixed(2)} SOL
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={toggleLive}
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: palette.border,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, fontWeight: '700' }}>
          DEMO TOGGLE: {live.isLive ? 'tap to end live state' : 'tap to start live state'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
