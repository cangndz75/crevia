import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { AdvisorPortrait } from '@/features/onboarding/components/AdvisorPortrait';
import { ADVISOR } from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AdvisorMessageBubbleProps = {
  message: string;
  compact?: boolean;
};

export function AdvisorMessageBubble({
  message,
  compact = false,
}: AdvisorMessageBubbleProps) {
  return (
    <Animated.View
      entering={FadeInLeft.duration(400).springify()}
      style={styles.row}>
      <AdvisorPortrait size="sm" showCaption={false} />
      <View style={[styles.bubble, compact && styles.bubbleCompact, shadows.soft]}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{ADVISOR.name}</Text>
          <Ionicons name="shield-checkmark" size={14} color={colors.authority} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#F3EEFA',
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.authority}18`,
  },
  bubbleCompact: {
    padding: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.authority,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
