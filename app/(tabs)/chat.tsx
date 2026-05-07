import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useChatMessages } from '@/hooks/useChatMessages';
import { sendChatMessage, ChatError } from '@/services/chat';
import { ChatBubble } from '@/components/ChatBubble';
import { useIdentity } from '@/stores/useIdentity';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function ChatScreen() {
  const messages = useChatMessages();
  const { uid, nickname, loading, bootstrap, setNickname } = useIdentity();
  const [draftNick, setDraftNick] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const handleSetNick = async () => {
    if (draftNick.trim().length < 2) {
      Alert.alert('Pick a nickname', 'Use at least 2 characters.');
      return;
    }
    await setNickname(draftNick);
  };

  const handleSend = async () => {
    if (!uid || !nickname) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setSending(true);
      await sendChatMessage({ uid, displayName: nickname, text: trimmed });
      setText('');
    } catch (err) {
      const message = err instanceof ChatError ? err.message : 'Could not send. Try again.';
      Alert.alert('Could not send', message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.background,
        }}
      >
        <Text style={{ color: palette.textMuted }}>Loading...</Text>
      </View>
    );
  }

  if (!nickname) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          padding: spacing.xl,
          gap: spacing.lg,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: palette.textPrimary,
            fontSize: fontSize.xxl,
            fontWeight: '900',
            fontFamily: 'SpaceGrotesk-Bold',
          }}
        >
          Pick a nickname
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.md }}>
          Used in Town Square. Change later in Profile.
        </Text>
        <TextInput
          value={draftNick}
          onChangeText={setDraftNick}
          placeholder="WaveScout"
          placeholderTextColor={palette.textMuted}
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
          }}
        />
        <PrimaryButton label="Enter Town Square" onPress={handleSetNick} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.xs,
        }}
      >
        <Text
          style={{
            color: palette.textPrimary,
            fontSize: fontSize.xxl,
            fontWeight: '900',
            fontFamily: 'SpaceGrotesk-Bold',
          }}
        >
          Town Square
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.sm }}>
          You are {nickname}. One message every 3 seconds.
        </Text>
      </View>

      <FlatList
        inverted
        data={[...messages].reverse()}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.xl }}
        renderItem={({ item }) => <ChatBubble message={item} isOwn={item.uid === uid} />}
      />

      <View
        style={{
          borderTopColor: palette.border,
          borderTopWidth: 1,
          padding: spacing.lg,
          gap: spacing.sm,
          backgroundColor: palette.card,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Say something..."
          placeholderTextColor={palette.textMuted}
          maxLength={240}
          multiline
          style={{
            backgroundColor: palette.surface,
            borderRadius: radii.md,
            borderColor: palette.border,
            borderWidth: 1,
            color: palette.textPrimary,
            padding: spacing.md,
            fontSize: fontSize.md,
            minHeight: 64,
            textAlignVertical: 'top',
          }}
        />
        <Pressable
          disabled={sending || text.trim().length === 0}
          onPress={handleSend}
          style={{
            backgroundColor: palette.accentStrong,
            padding: spacing.md,
            borderRadius: radii.md,
            alignItems: 'center',
            opacity: sending || text.trim().length === 0 ? 0.6 : 1,
          }}
        >
          <Text style={{ color: palette.textPrimary, fontWeight: '800' }}>
            {sending ? 'Sending...' : 'Send'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
