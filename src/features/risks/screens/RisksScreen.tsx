import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { RiskListCard } from '@/features/risks/components/RiskListCard';
import { RiskRegisterHeader } from '@/features/risks/components/RiskRegisterHeader';
import { RiskSummaryRow } from '@/features/risks/components/RiskSummaryRow';
import { mockGameData } from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function RisksScreen() {
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight + spacing.lg;

  return (
    <View style={styles.root}>
      <RiskRegisterHeader />
      <RiskSummaryRow />

      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}>
        {mockGameData.risks.map((risk) => (
          <RiskListCard key={risk.id} risk={risk} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listScroll: {
    flex: 1,
    backgroundColor: colors.riskListBg,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
