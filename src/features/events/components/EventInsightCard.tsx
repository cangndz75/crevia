import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventCard } from '@/core/models/EventCard';
import { getTrustInsight } from '@/features/events/utils/eventDetailDecisionUtils';
import { shadows } from '@/ui/theme/shadows';

type EventInsightCardProps = {
  event: EventCard;
};

function TrustGauge({ valueLabel }: { valueLabel: string }) {
  const size = 108;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.62;
  const offset = circumference - arcLength;

  return (
    <View style={gaugeStyles.wrap}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={eventDetail.red} />
            <Stop offset="50%" stopColor={eventDetail.orange} />
            <Stop offset="100%" stopColor={eventDetail.success} />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={128}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={gaugeStyles.center}>
        <Text style={gaugeStyles.value}>{valueLabel}</Text>
      </View>
    </View>
  );
}

function MetricChip({
  title,
  value,
  level,
  barColor,
}: {
  title: string;
  value: string;
  level: number;
  barColor: string;
}) {
  return (
    <View style={chipStyles.card}>
      <Text style={chipStyles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={chipStyles.value}>{value}</Text>
      <View style={chipStyles.track}>
        <View
          style={[
            chipStyles.fill,
            { width: `${Math.round(level * 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

export function EventInsightCard({ event }: EventInsightCardProps) {
  const { width } = useWindowDimensions();
  const insight = getTrustInsight(event);
  const compact = width < 360;

  return (
    <View style={[styles.card, shadows.card]}>
      <LinearGradient
        colors={[eventDetail.tealDark, eventDetail.teal, '#0E7A72']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}>
        <View style={styles.left}>
          <Text style={styles.gaugeLabel}>{insight.label}</Text>
          <TrustGauge valueLabel={insight.value} />
          <Text style={styles.delta}>{insight.delta}</Text>
        </View>

        <View style={styles.rightScene}>
          <View style={styles.skyline}>
            <View style={[styles.building, { height: 42, opacity: 0.35 }]} />
            <View style={[styles.building, { height: 58, opacity: 0.5 }]} />
            <View style={[styles.building, { height: 36, opacity: 0.3 }]} />
            <View style={styles.tree} />
          </View>
        </View>

        <View style={[styles.chipsRow, compact && styles.chipsCol]}>
          <MetricChip
            title="Sosyal Geri Bildirim"
            value={insight.socialFeedback}
            level={insight.socialLevel}
            barColor={eventDetail.red}
          />
          <MetricChip
            title="Ekip Yoğunluğu"
            value={insight.crewLoad}
            level={insight.crewLevel}
            barColor={eventDetail.orange}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

const chipStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 118,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  title: {
    fontSize: 9,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.textDark,
    marginTop: 2,
    marginBottom: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(6, 63, 59, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: eventDetail.cardRadius,
    overflow: 'hidden',
    marginHorizontal: eventDetail.screenPadding,
  },
  gradient: {
    minHeight: 188,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  left: {
    width: '42%',
    minWidth: 130,
    zIndex: 2,
  },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  delta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  rightScene: {
    flex: 1,
    minWidth: 100,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  skyline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    opacity: 0.9,
  },
  building: {
    width: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tree: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(108, 203, 142, 0.55)',
    marginBottom: 4,
  },
  chipsRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    zIndex: 3,
  },
  chipsCol: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    top: 8,
  },
});
