import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { OperationPhaseShellPresentation } from '@/features/events/utils/operationPhaseTransitionPresentation';
import { CreviaMotionView } from '@/shared/motion';

type OperationPhaseShellHeaderProps = {
  shell: OperationPhaseShellPresentation;
  compact?: boolean;
  onBack?: () => void;
  reducedMotion?: boolean;
};

export function OperationPhaseShellHeader({
  shell,
  compact = false,
  onBack,
  reducedMotion = false,
}: OperationPhaseShellHeaderProps) {
  const backInteractive = Boolean(onBack);
  const metrics = shell.metrics?.slice(0, 2) ?? [];
  const inspectHeader = shell.phaseKey === 'inspect';

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={styles.header}>
      {backInteractive ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.headerIconButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
        </Pressable>
      ) : (
        <View style={styles.headerIconButton}>
          <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
        </View>
      )}
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>
          {shell.title}
        </Text>
        {!inspectHeader && (shell.statusSummary || shell.subtitle) ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {shell.statusSummary ?? shell.subtitle}
          </Text>
        ) : !inspectHeader ? (
          <View style={styles.headerAccent}>
            <View style={styles.headerAccentLine} />
            <Ionicons name="sparkles" size={10} color="#C58B18" />
            <View style={styles.headerAccentLine} />
          </View>
        ) : null}
      </View>
      <View style={styles.metricBadges}>
        {metrics.length > 0 ? (
          metrics.map((metric) => (
            <View
              key={`${metric.label}:${metric.value}`}
              style={[
                styles.metricBadge,
                metric.tone === 'warning' && styles.metricBadgeWarning,
                metric.tone === 'positive' && styles.metricBadgePositive,
              ]}>
              <View style={styles.metricDot} />
              <Text style={styles.metricValue} numberOfLines={1}>
                {metric.value}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.metricBadge}>
            <View style={styles.metricDot} />
            <Text style={styles.metricValue} numberOfLines={1}>
              {shell.phaseLabel}
            </Text>
          </View>
        )}
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6,63,59,0.08)',
  },
  headerIconButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  headerTitleCompact: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerAccentLine: {
    width: 26,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D9A646',
  },
  metricBadges: {
    alignItems: 'flex-end',
    gap: 4,
    width: 112,
  },
  metricBadge: {
    maxWidth: 112,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderColor: 'rgba(11, 107, 97, 0.16)',
  },
  metricBadgeWarning: {
    backgroundColor: 'rgba(216, 167, 46, 0.13)',
    borderColor: 'rgba(216, 167, 46, 0.28)',
  },
  metricBadgePositive: {
    backgroundColor: 'rgba(73, 152, 110, 0.12)',
    borderColor: 'rgba(73, 152, 110, 0.22)',
  },
  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: eventDetail.teal,
  },
  metricValue: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
});
