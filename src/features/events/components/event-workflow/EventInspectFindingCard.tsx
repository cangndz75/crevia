import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventInspectFinding } from '@/features/events/utils/eventInspectPhasePresentation';
import { getInspectFindingRevealTiming } from '@/features/events/utils/eventInspectPhasePresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TONE_COLORS: Record<EventInspectFinding['tone'], string> = {
  positive: eventDetail.success,
  neutral: eventDetail.teal,
  warning: eventDetail.orange,
  urgent: eventDetail.red,
};

const ICON_MAP: Record<string, IconName> = {
  'pulse-outline': 'pulse-outline',
  'location-outline': 'location-outline',
  'chatbubbles-outline': 'chatbubbles-outline',
  'briefcase-outline': 'briefcase-outline',
  'git-network-outline': 'git-network-outline',
  'people-outline': 'people-outline',
  'alert-circle-outline': 'alert-circle-outline',
  'document-text-outline': 'document-text-outline',
  'analytics-outline': 'analytics-outline',
};

type EventInspectFindingCardProps = {
  finding: EventInspectFinding;
  index: number;
  reducedMotion?: boolean;
};

export function EventInspectFindingCard({
  finding,
  index,
  reducedMotion = false,
}: EventInspectFindingCardProps) {
  const timing = getInspectFindingRevealTiming(index, reducedMotion);
  const accent = TONE_COLORS[finding.tone];
  const iconName = ICON_MAP[finding.iconKey] ?? 'ellipse-outline';

  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={index}
      reducedMotion={reducedMotion || !timing.enabled}
      disabled={!timing.enabled}
      style={styles.motionWrap}>
      <View style={[styles.card, shadows.soft, { borderLeftColor: accent }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
            <Ionicons name={iconName} size={16} color={accent} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={2}>
              {finding.title}
            </Text>
            <Text style={styles.source} numberOfLines={1}>
              {finding.sourceLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.body} numberOfLines={3}>
          {finding.body}
        </Text>
      </View>
    </CreviaMotionView>
  );
}

type EventInspectScanAreaProps = {
  isAnalyzing: boolean;
  scanDurationMs: number;
  reducedMotion?: boolean;
  eventTitle: string;
};

export function EventInspectScanArea({
  isAnalyzing,
  scanDurationMs,
  reducedMotion = false,
  eventTitle,
}: EventInspectScanAreaProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isAnalyzing || reducedMotion) {
      progress.value = isAnalyzing && reducedMotion ? 1 : 0;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, { duration: Math.max(scanDurationMs, 600) });
  }, [isAnalyzing, progress, reducedMotion, scanDurationMs]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, progress.value * 100)}%`,
  }));

  return (
    <View style={[styles.scanCard, shadows.card]} accessibilityRole="summary">
      <View style={styles.scanHeader}>
        <Ionicons
          name={isAnalyzing ? 'scan-outline' : 'search-outline'}
          size={18}
          color={eventDetail.teal}
        />
        <Text style={styles.scanTitle} numberOfLines={1}>
          {isAnalyzing ? 'Olay analiz ediliyor' : 'Analiz bekleniyor'}
        </Text>
      </View>
      <Text style={styles.scanSubtitle} numberOfLines={2}>
        {isAnalyzing
          ? `${eventTitle} için saha ve sosyal sinyaller taranıyor.`
          : 'İncelemeyi başlat; bulgular kısa sürede açılacak.'}
      </Text>
      <View style={styles.scanTrack}>
        <Animated.View style={[styles.scanFill, fillStyle]} />
      </View>
    </View>
  );
}

type EventInspectAdvisorCommentCardProps = {
  title: string;
  text: string;
  tone: 'calm' | 'teaching' | 'warning' | 'urgent' | 'positive';
  reducedMotion?: boolean;
};

const ADVISOR_TONE: Record<
  EventInspectAdvisorCommentCardProps['tone'],
  { border: string; icon: IconName }
> = {
  calm: { border: 'rgba(11, 107, 97, 0.18)', icon: 'leaf-outline' },
  teaching: { border: 'rgba(216, 167, 46, 0.35)', icon: 'school-outline' },
  warning: { border: 'rgba(199, 137, 37, 0.35)', icon: 'alert-circle-outline' },
  urgent: { border: 'rgba(184, 90, 75, 0.35)', icon: 'warning-outline' },
  positive: { border: 'rgba(62, 158, 106, 0.28)', icon: 'checkmark-circle-outline' },
};

export function EventInspectAdvisorCommentCard({
  title,
  text,
  tone,
  reducedMotion = false,
}: EventInspectAdvisorCommentCardProps) {
  const palette = ADVISOR_TONE[tone];

  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={styles.advisorMotionWrap}>
      <View style={[styles.advisorCard, { borderColor: palette.border }]}>
        <View style={styles.advisorHeader}>
          <Ionicons name={palette.icon} size={16} color={eventDetail.tealDark} />
          <Text style={styles.advisorTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.advisorText} numberOfLines={3}>
          {text}
        </Text>
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  motionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  card: {
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    borderLeftWidth: 3,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
  source: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
  scanCard: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    gap: 10,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  scanSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  scanTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
    overflow: 'hidden',
  },
  scanFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: eventDetail.teal,
  },
  advisorMotionWrap: {
    marginHorizontal: eventDetail.screenPadding,
  },
  advisorCard: {
    backgroundColor: '#FFFCF5',
    borderRadius: eventDetail.cardRadius,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advisorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  advisorText: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
});
