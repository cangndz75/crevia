import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityDetailPanel } from '@/features/progression/components/AbilityDetailPanel';
import { AbilityTreeView } from '@/features/progression/components/AbilityTreeView';
import { ProgressionHeader } from '@/features/progression/components/ProgressionHeader';
import { mockGameData } from '@/core/content/mockGameData';
import { Ability } from '@/core/models/Ability';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

const defaultAbility =
  mockGameData.abilities.find((a) => a.id === 'route-edit') ??
  mockGameData.abilities[0];

export function ProgressionScreen() {
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.lg;
  const [selected, setSelected] = useState<Ability>(defaultAbility);

  return (
    <View style={styles.root}>
      <ProgressionHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}>
        <AbilityTreeView
          selectedId={selected.id}
          onSelect={setSelected}
        />

        <View style={styles.detailWrap}>
          <AbilityDetailPanel ability={selected} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.progressionBg,
  },
  content: {
    flexGrow: 1,
  },
  detailWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
