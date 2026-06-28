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
        {shell.subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {shell.subtitle}
          </Text>
        ) : (
          <View style={styles.headerAccent}>
            <View style={styles.headerAccentLine} />
            <Ionicons name="sparkles" size={10} color="#C58B18" />
            <View style={styles.headerAccentLine} />
          </View>
        )}
      </View>
      <View style={styles.resourceBadges}>
        <View style={[styles.resourceBadge, styles.resourceBadgeMint]}>
          <Ionicons name="diamond-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.resourceText}>1.250</Text>
        </View>
        <View style={[styles.resourceBadge, styles.resourceBadgeGold]}>
          <Ionicons name="medal-outline" size={13} color="#B77713" />
          <Text style={[styles.resourceText, styles.resourceTextGold]}>860</Text>
        </View>
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 22,
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
  resourceBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  resourceBadgeMint: {
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderColor: 'rgba(11, 107, 97, 0.16)',
  },
  resourceBadgeGold: {
    backgroundColor: 'rgba(216, 167, 46, 0.12)',
    borderColor: 'rgba(216, 167, 46, 0.28)',
  },
  resourceText: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  resourceTextGold: {
    color: '#B77713',
  },
});
