import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import type { PlanSummaryUi } from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

const fastImage = require('../../../../../../assets/b9.png');
const balancedImage = require('../../../../../../assets/b4.png');
const economyImage = require('../../../../../../assets/b2.png');

type PlanSummaryCardProps = {
  summary: PlanSummaryUi;
  selectedPlanTitle: string;
  selectedPlanNote: string;
  selectedPlanId: PlanOptionId;
};

function imageForPlan(planId: PlanOptionId): ImageSource {
  if (planId === 'fast') return fastImage;
  if (planId === 'economy') return economyImage;
  return balancedImage;
}

export function PlanSummaryCard({
  summary,
  selectedPlanTitle,
  selectedPlanNote,
  selectedPlanId,
}: PlanSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText} numberOfLines={1}>
          ÖNERİLEN PLAN
        </Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.left}>
          <View style={styles.recommendRow}>
            <Ionicons name="star" size={21} color="#D8AA24" />
            <Text style={styles.title} numberOfLines={2}>
              Önerimiz: {selectedPlanTitle}
            </Text>
          </View>
          <Text style={styles.note} numberOfLines={3}>
            {selectedPlanNote}
          </Text>
        </View>

        <Image source={imageForPlan(selectedPlanId)} style={styles.planImage} contentFit="contain" />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Ionicons name="time-outline" size={20} color={eventDetail.tealDark} />
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Tahmini Süre
            </Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {summary.duration}
            </Text>
          </View>
        </View>
        <View style={styles.metricBox}>
          <Ionicons name="locate-outline" size={20} color={eventDetail.tealDark} />
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              Başarı İhtimali
            </Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {summary.success}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    minHeight: 148,
    backgroundColor: eventDetail.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 12,
    paddingTop: 24,
    gap: 10,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderBottomRightRadius: 10,
    backgroundColor: '#3E8C6E',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  note: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  planImage: {
    width: 92,
    height: 76,
    flexShrink: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#F6F2EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
  },
  metricTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
});
