import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useIdentity } from '@/stores/useIdentity';
import { ArtistAvatar } from '@/components/ArtistAvatar';

export default function ProfileScreen() {
  const { uid, nickname, loading, bootstrap, setNickname } = useIdentity();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const startEdit = () => {
    setDraft(nickname ?? '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (draft.trim().length < 2) {
      Alert.alert('Pick a longer nickname', 'Use at least 2 characters.');
      return;
    }
    await setNickname(draft);
    setEditing(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'This clears your nickname. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('wwapp.demo.nickname');
          await bootstrap();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: palette.textMuted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}
    >
      <Text
        style={{
          color: palette.textPrimary,
          fontSize: fontSize.xxl,
          fontWeight: '900',
          fontFamily: 'SpaceGrotesk-Bold',
        }}
      >
        Profile
      </Text>

      <View
        style={{
          backgroundColor: palette.card,
          padding: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.border,
          gap: spacing.md,
          alignItems: 'center',
        }}
      >
        <ArtistAvatar name={nickname ?? 'Anon'} size={88} />
        {editing ? (
          <View style={{ width: '100%', gap: spacing.sm }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              maxLength={24}
              autoCapitalize="none"
              style={{
                backgroundColor: palette.surface,
                borderRadius: radii.md,
                borderColor: palette.border,
                borderWidth: 1,
                color: palette.textPrimary,
                padding: spacing.md,
                fontSize: fontSize.md,
                textAlign: 'center',
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => setEditing(false)}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: palette.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: palette.accentStrong,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={{ color: palette.textPrimary, fontSize: fontSize.xl, fontWeight: '900' }}>
              {nickname ?? 'Anon'}
            </Text>
            <Pressable onPress={startEdit}>
              <Text style={{ color: palette.accent, fontWeight: '700' }}>Edit nickname</Text>
            </Pressable>
          </>
        )}
        {uid ? (
          <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>id: {uid}</Text>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: palette.card,
          padding: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.border,
          gap: spacing.sm,
        }}
      >
        <Text
          style={{
            color: palette.textMuted,
            fontSize: fontSize.xs,
            fontWeight: '700',
            letterSpacing: 0.5,
          }}
        >
          SOLANA WALLET
        </Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>
          Not connected. Phantom wallet connect lands in a future build.
        </Text>
        <Pressable
          disabled
          style={{
            marginTop: spacing.sm,
            backgroundColor: palette.surface,
            padding: spacing.md,
            borderRadius: radii.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: palette.border,
            opacity: 0.6,
          }}
        >
          <Text style={{ color: palette.textMuted, fontWeight: '800' }}>
            Connect Phantom (coming soon)
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: palette.card,
          padding: spacing.lg,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.border,
          gap: spacing.sm,
        }}
      >
        <Text
          style={{
            color: palette.textMuted,
            fontSize: fontSize.xs,
            fontWeight: '700',
            letterSpacing: 0.5,
          }}
        >
          NOTIFICATIONS
        </Text>
        <Text style={{ color: palette.textPrimary, fontSize: fontSize.md }}>
          Push alerts land once Firebase is wired. For now, watch the Live tab for state changes.
        </Text>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={{
          backgroundColor: palette.dangerDim,
          padding: spacing.md,
          borderRadius: radii.md,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: palette.danger,
        }}
      >
        <Text style={{ color: palette.danger, fontWeight: '800' }}>Clear nickname</Text>
      </Pressable>
    </ScrollView>
  );
}
