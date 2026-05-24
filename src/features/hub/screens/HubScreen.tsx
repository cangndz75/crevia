import { StyleSheet, View } from "react-native";

import { ActiveEventsSection } from "@/features/hub/components/ActiveEventsSection";
import { CrisisQueuePreview } from "@/features/hub/components/CrisisQueuePreview";
import { DailyMissionsSection } from "@/features/hub/components/DailyMissionsSection";
import { HubHeader } from "@/features/hub/components/HubHeader";
import { RiskPressureCard } from "@/features/hub/components/RiskPressureCard";
import { AppScreen } from "@/ui/components/AppScreen";
import { spacing } from "@/ui/theme/spacing";

export function HubScreen() {
  return (
    <AppScreen safeEdges={["left", "right"]} contentStyle={styles.content}>
      <HubHeader />
      <View style={styles.body}>
        <RiskPressureCard />
        <CrisisQueuePreview />
        <DailyMissionsSection />
        <ActiveEventsSection />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
});
