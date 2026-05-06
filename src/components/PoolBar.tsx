import { View, Text } from 'react-native';
import { palette, fontSize, spacing } from '@/theme';

interface Props {
  poolASol: number;
  poolBSol: number;
  labelA?: string;
  labelB?: string;
}

export const PoolBar = ({ poolASol, poolBSol, labelA, labelB }: Props) => {
  const total = poolASol + poolBSol;
  const aPct = total === 0 ? 50 : Math.round((poolASol / total) * 100);
  const bPct = 100 - aPct;
  const totalLabel = total === 0 ? '0.00 SOL pool' : `${total.toFixed(2)} SOL pool`;

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={{
          flexDirection: 'row',
          height: 10,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: palette.border,
        }}
      >
        <View style={{ width: `${aPct}%`, backgroundColor: palette.accentStrong }} />
        <View style={{ width: `${bPct}%`, backgroundColor: palette.accent }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.xs, fontWeight: '700' }}>
          {labelA ? `${labelA} ${aPct}%` : `${aPct}%`}
        </Text>
        <Text style={{ color: palette.textMuted, fontSize: fontSize.xs }}>{totalLabel}</Text>
        <Text style={{ color: palette.textSecondary, fontSize: fontSize.xs, fontWeight: '700' }}>
          {labelB ? `${bPct}% ${labelB}` : `${bPct}%`}
        </Text>
      </View>
    </View>
  );
};
