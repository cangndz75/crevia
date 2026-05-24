import { StyleSheet, View } from 'react-native';

import { AdvisorBriefingCard } from '@/features/hub/components/AdvisorBriefingCard';
import { HubCityPulseSection } from '@/features/hub/components/HubCityPulseSection';
import { HubTopBar } from '@/features/hub/components/HubTopBar';
import { LiveOpsPulseStrip } from '@/features/hub/components/LiveOpsPulseStrip';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function HubHeader() {
  return (
    <View style={styles.wrapper}>
      <HubTopBar />
      <HubCityPulseSection />
      <View style={styles.lower}>
        <LiveOpsPulseStrip />
        <AdvisorBriefingCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
  },
  lower: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
});
