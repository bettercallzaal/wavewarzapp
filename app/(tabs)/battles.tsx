import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { palette, spacing, fontSize, radii } from '@/theme';
import { useBattles } from '@/hooks/useBattles';
import { BattleCard } from '@/components/BattleCard';
import type { BattleStatus } from '@/types/firestore';

const TABS: BattleStatus[] = ['live', 'upcoming', 'settled'];
const LABELS: Record<BattleStatus, string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  settled: 'Recent',
};

export default function BattlesScreen() {
  const [active, setActive] = useState<BattleStatus>('live');
  const battles = useBattles(active);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.lg,
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
          Battles
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setActive(t)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.pill,
                backgroundColor: active === t ? palette.accentStrong : palette.surface,
                borderWidth: 1,
                borderColor: active === t ? palette.accentStrong : palette.border,
              }}
            >
              <Text
                style={{
                  color: palette.textPrimary,
                  fontWeight: '700',
                  fontSize: fontSize.sm,
                }}
              >
                {LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={battles}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, gap: spacing.lg }}
        renderItem={({ item }) => <BattleCard battle={item} />}
        ListEmptyComponent={
          <Text
            style={{
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: spacing.xxxl,
              fontSize: fontSize.md,
            }}
          >
            No battles in this state.
          </Text>
        }
      />
    </View>
  );
}
