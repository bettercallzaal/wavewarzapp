import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useArtist } from '@/hooks/useArtist';
import { ArtistAvatar } from '@/components/ArtistAvatar';

const TIER_LABEL: Record<string, string> = {
  rising_star: 'Rising Star',
  veteran: 'Battle Veteran',
  legend: 'Battle Legend',
};

export default function ArtistScreen() {
  const params = useLocalSearchParams<{ wallet: string }>();
  const router = useRouter();
  const artist = useArtist(params.wallet ?? null);
  const [followed, setFollowed] = useState(false);

  if (!artist) {
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
        <Text style={{ color: palette.textMuted }}>Artist not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: palette.accent, fontWeight: '700' }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const stats = [
    { label: 'Wins', value: String(artist.wins) },
    { label: 'Losses', value: String(artist.losses) },
    { label: 'Win %', value: `${artist.winRatePercent.toFixed(0)}%` },
    { label: 'Volume', value: `${artist.volumeSol.toFixed(2)} SOL` },
    { label: 'Earnings', value: `${artist.earningsSol.toFixed(3)} SOL` },
  ];

  const handleFollow = () => {
    setFollowed((p) => !p);
    Alert.alert(
      followed ? 'Unfollowed' : 'Following',
      followed
        ? `You will no longer be notified about ${artist.name}.`
        : `You will be notified the next time ${artist.name} battles. (Push lands once Firebase is wired.)`,
    );
  };

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
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <ArtistAvatar name={artist.name} size={104} />
          <Text
            style={{
              color: palette.textPrimary,
              fontSize: fontSize.hero,
              fontWeight: '900',
              fontFamily: 'SpaceGrotesk-Bold',
              textAlign: 'center',
            }}
          >
            {artist.name}
          </Text>
          {artist.twitterHandle ? (
            <Text style={{ color: palette.accent, fontSize: fontSize.md }}>
              @{artist.twitterHandle}
            </Text>
          ) : null}
          {artist.spotlightTier ? (
            <View
              style={{
                backgroundColor: palette.accentStrong + '33',
                paddingHorizontal: spacing.md,
                paddingVertical: 6,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: palette.accentStrong,
              }}
            >
              <Text
                style={{
                  color: palette.accentStrong,
                  fontWeight: '900',
                  fontSize: fontSize.xs,
                  letterSpacing: 0.5,
                }}
              >
                {(TIER_LABEL[artist.spotlightTier] ?? artist.spotlightTier).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <View
              key={s.label}
              style={{
                flexBasis: '31%',
                flexGrow: 1,
                backgroundColor: palette.card,
                padding: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>{s.label}</Text>
              <Text
                style={{
                  color: palette.textPrimary,
                  fontSize: fontSize.lg,
                  fontWeight: '800',
                  marginTop: 4,
                }}
              >
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleFollow}
          style={{
            backgroundColor: followed ? palette.surface : palette.accentStrong,
            padding: spacing.lg,
            borderRadius: radii.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: followed ? palette.border : palette.accentStrong,
          }}
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>
            {followed ? 'Following - tap to unfollow' : 'Notify me on next battle'}
          </Text>
        </Pressable>

        <Text
          style={{
            color: palette.textMuted,
            fontSize: fontSize.xs,
            textAlign: 'center',
          }}
          selectable
        >
          {artist.wallet}
        </Text>
      </ScrollView>
    </View>
  );
}
