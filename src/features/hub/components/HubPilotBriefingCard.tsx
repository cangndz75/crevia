import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { PilotBriefingModel } from '@/core/onboarding/onboardingTypes';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { shadows } from '@/ui/theme/shadows';

type HubPilotBriefingCardProps = {
  model: PilotBriefingModel;
};

function iconForKey(iconKey: string): keyof typeof Ionicons.glyphMap {
  switch (iconKey) {
    case 'workflow_plan':
      return 'git-compare-outline';
    case 'workflow_assign':
      return 'navigate-outline';
    default:
      return 'search-outline';
  }
}

export function HubPilotBriefingCard({ model }: HubPilotBriefingCardProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={styles.title} numberOfLines={1}>
        {model.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {model.subtitle}
      </Text>
      <Text style={styles.goal} numberOfLines={1}>
        {model.goalLine}
      </Text>

      <View style={styles.steps}>
        {model.steps.map((step) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Ionicons
                name={iconForKey(step.iconKey)}
                size={12}
                color={colors.primary}
              />
            </View>
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle} numberOfLines={1}>
                {step.title}
              </Text>
              <Text style={styles.stepLine} numberOfLines={2}>
                {step.line}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.xs,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  goal: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  steps: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    minWidth: 0,
  },
  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11, 107, 97, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepLine: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
