import { Pressable, Text, type PressableProps } from 'react-native';
import { palette, fontSize, radii } from '@/theme';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary';
  busy?: boolean;
}

export const PrimaryButton = ({ label, variant = 'primary', busy, disabled, ...rest }: Props) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      disabled={busy || disabled}
      style={({ pressed }) => ({
        backgroundColor: isPrimary ? palette.accentStrong : palette.surface,
        borderColor: isPrimary ? 'transparent' : palette.border,
        borderWidth: isPrimary ? 0 : 1,
        paddingVertical: 18,
        borderRadius: radii.md,
        alignItems: 'center',
        opacity: busy || disabled ? 0.6 : pressed ? 0.92 : 1,
      })}
      {...rest}
    >
      <Text
        style={{
          color: palette.textPrimary,
          fontSize: fontSize.md,
          fontWeight: '800',
          fontFamily: 'Inter-Bold',
        }}
      >
        {busy ? 'Working...' : label}
      </Text>
    </Pressable>
  );
};
