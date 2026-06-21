import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthorityPermissionPreviewPanel } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionPreviewPanel';
import { spacing } from '@/ui/theme/spacing';

type AuthoritiesTabPanelProps = {
  authorityState: unknown;
  pilotDay: number;
  totalXp?: number;
};

export function AuthoritiesTabPanel({
  authorityState,
  pilotDay,
  totalXp = 0,
}: AuthoritiesTabPanelProps) {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.wrap}>
      <AuthorityPermissionPreviewPanel
        authorityState={authorityState}
        pilotDay={pilotDay}
        totalXp={totalXp}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
});
