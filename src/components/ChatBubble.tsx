import { View, Text } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import type { ChatMessage } from '@/types/firestore';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatBubble = ({ message, isOwn }: Props) => (
  <View
    style={{
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      maxWidth: '82%',
      gap: 4,
      marginBottom: spacing.md,
    }}
  >
    {!isOwn ? (
      <Text style={{ color: palette.textMuted, fontSize: fontSize.xs, marginLeft: 8 }}>
        {message.displayName}
      </Text>
    ) : null}
    <View
      style={{
        backgroundColor: isOwn ? palette.accentStrong : palette.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: isOwn ? palette.accentStrong : palette.border,
      }}
    >
      <Text style={{ color: palette.textPrimary, fontSize: fontSize.md, lineHeight: 22 }}>
        {message.text}
      </Text>
    </View>
  </View>
);
