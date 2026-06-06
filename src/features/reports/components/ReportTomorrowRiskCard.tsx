import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { TomorrowRiskModel } from '@/core/tomorrowRisk';

type Props = {
  model: TomorrowRiskModel | null | undefined;
  compact?: boolean;
};

const TONE_COLOR: Record<TomorrowRiskModel['tone'], string> = {
  calm: '#4A5F5B',
  watch: '#846116',
  recovery: '#0F6B64',
  opportunity: '#285E58',
  risk: '#8A4B27',
};

const TONE_BG: Record<TomorrowRiskModel['tone'], string> = {
  calm: '#FFFDF8',
  watch: '#FFF8E5',
  recovery: '#EFFAF5',
  opportunity: '#F4FBF8',
  risk: '#FFF4EC',
};

function iconForKind(kind: TomorrowRiskModel['kind']): keyof typeof Ionicons.glyphMap {
  if (kind.includes('route') || kind.includes('vehicle')) return 'navigate-outline';
  if (kind.includes('container')) return 'trash-outline';
  if (kind.includes('social') || kind.includes('recovery')) return 'chatbubbles-outline';
  if (kind.includes('personnel')) return 'people-outline';
  if (kind.includes('district')) return 'map-outline';
  if (kind.includes('crisis')) return 'shield-checkmark-outline';
  return 'time-outline';
}

export function ReportTomorrowRiskCard({ model, compact = false }: Props) {
  if (!model?.shouldShowInReport) return null;
  const color = TONE_COLOR[model.tone];

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: TONE_BG[model.tone], borderColor: `${color}24` },
      ]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}14` }]}>
          <Ionicons name={iconForKind(model.kind)} size={17} color={color} />
        </View>
        <Text style={[styles.title, { color }]} numberOfLines={1} ellipsizeMode="tail">
          {model.title}
        </Text>
      </View>
      <Text style={[styles.mainLine, { color }]} numberOfLines={model.maxVisibleLines}>
        {model.mainLine}
      </Text>
      {model.supportLine ? (
        <Text style={styles.supportLine} numberOfLines={compact ? 1 : 2}>
          {model.supportLine}
        </Text>
      ) : null}
      {model.ctaLine ? (
        <Text style={[styles.ctaLine, { color }]} numberOfLines={1} ellipsizeMode="tail">
          {model.ctaLine}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  cardCompact: {
    paddingVertical: 12,
    gap: 7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  mainLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  supportLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#63706D',
  },
  ctaLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
});
