import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  EventResultInfoCardModel,
  EventResultProgressStripModel,
} from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type ProgressProps = {
  strips: EventResultProgressStripModel[];
};

type InfoProps = {
  model: EventResultInfoCardModel;
};

function EventResultProgressStrip({ strip }: { strip: EventResultProgressStripModel }) {
  const showProgress = strip.id === 'dailyGoal';

  return (
    <View style={[styles.strip, shadows.soft]}>
      <Ionicons name={strip.iconName} size={18} color={eventDetail.tealMid} />
      <Text style={styles.stripText} numberOfLines={1}>
        {strip.text}
      </Text>
      {showProgress ? (
        <View style={styles.progressBlock}>
          <Text style={styles.progressText} numberOfLines={1}>
            {strip.progressText ?? '1/1'}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round((strip.progressRatio ?? 1) * 100)}%` },
              ]}
            />
          </View>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={eventDetail.textMuted} />
    </View>
  );
}

export function EventResultProgressStrips({ strips }: ProgressProps) {
  if (strips.length === 0) {
    return null;
  }

  return (
    <View style={styles.stripWrap}>
      {strips.map((strip) => (
        <EventResultProgressStrip key={strip.id} strip={strip} />
      ))}
    </View>
  );
}

export function EventResultInfoCard({ model }: InfoProps) {
  return (
    <View style={[styles.infoCard, shadows.soft]}>
      <View style={styles.infoIconCircle}>
        <Ionicons name="ribbon-outline" size={20} color={colors.hubGoldDark} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.infoBody} numberOfLines={2}>
          {model.body}
        </Text>
      </View>
      <View style={styles.chartIllustration}>
        <View style={[styles.chartBar, styles.chartBarA]} />
        <View style={[styles.chartBar, styles.chartBarB]} />
        <View style={[styles.chartBar, styles.chartBarC]} />
      </View>
    </View>
  );
}

/** @deprecated Use EventResultProgressStrips + EventResultInfoCard */
export function EventResultMetaFeedbackStrip({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <View style={styles.stripWrap}>
      {lines.map((line) => (
        <View key={line} style={styles.strip}>
          <Text style={styles.stripText} numberOfLines={1}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

type ActionProps = {
  primaryTitle: string;
  primarySubtitle: string;
  secondaryTitle: string;
  secondarySubtitle: string;
  showSecondary?: boolean;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
};

export function EventResultActionRows({
  primaryTitle,
  primarySubtitle,
  secondaryTitle,
  secondarySubtitle,
  showSecondary = true,
  onPrimaryPress,
  onSecondaryPress,
}: ActionProps) {
  return (
    <View style={styles.actionWrap}>
      <Pressable
        onPress={onPrimaryPress}
        style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
        accessibilityRole="button">
        <View style={styles.primaryIconCircle}>
          <Ionicons name="flash" size={18} color={colors.textInverse} />
        </View>
        <View style={styles.actionCopy}>
          <Text style={styles.primaryTitle} numberOfLines={1}>
            {primaryTitle}
          </Text>
          <Text style={styles.primarySubtitle} numberOfLines={2}>
            {primarySubtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
      </Pressable>

      {showSecondary && onSecondaryPress ? (
        <Pressable
          onPress={onSecondaryPress}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
          accessibilityRole="button">
          <View style={styles.secondaryIconCircle}>
            <Ionicons name="document-text-outline" size={18} color={eventDetail.tealDark} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.secondaryTitle} numberOfLines={1}>
              {secondaryTitle}
            </Text>
            <Text style={styles.secondarySubtitle} numberOfLines={1}>
              {secondarySubtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={eventDetail.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stripWrap: {
    marginHorizontal: 18,
    gap: 8,
    minWidth: 0,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 17,
    paddingHorizontal: 14,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    minWidth: 0,
  },
  stripText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: eventDetail.textDark,
    flexShrink: 1,
    minWidth: 0,
  },
  progressBlock: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  progressTrack: {
    width: 52,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDF4E8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  infoCard: {
    marginHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFCF5',
    borderRadius: 20,
    padding: 16,
    minHeight: 112,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.22)',
    minWidth: 0,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.hubGoldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  infoBody: {
    fontSize: 14,
    fontWeight: '600',
    color: eventDetail.textMuted,
    lineHeight: 19,
    flexShrink: 1,
    minWidth: 0,
  },
  chartIllustration: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 36,
    flexShrink: 0,
  },
  chartBar: {
    width: 8,
    borderRadius: 3,
    backgroundColor: colors.hubGold,
  },
  chartBarA: {
    height: 14,
    opacity: 0.45,
  },
  chartBarB: {
    height: 24,
    opacity: 0.7,
  },
  chartBarC: {
    height: 32,
  },
  actionWrap: {
    marginHorizontal: 18,
    gap: 10,
    minWidth: 0,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: eventDetail.tealDark,
    borderRadius: 21,
    paddingHorizontal: 16,
    minHeight: 86,
    minWidth: 0,
  },
  primaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
    flexShrink: 1,
    minWidth: 0,
  },
  primarySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
    flexShrink: 1,
    minWidth: 0,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 19,
    paddingHorizontal: 16,
    minHeight: 74,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 0,
  },
  secondaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    flexShrink: 1,
    minWidth: 0,
  },
  secondarySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flexShrink: 1,
    minWidth: 0,
  },
  actionCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
