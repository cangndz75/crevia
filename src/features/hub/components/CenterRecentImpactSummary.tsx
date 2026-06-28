import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterRecentImpactSummaryPresentation } from '@/features/hub/utils/centerHubDepthPresentation';

type CenterRecentImpactSummaryProps = {
  presentation: CenterRecentImpactSummaryPresentation;
};

function chipToneStyle(tone: CenterRecentImpactSummaryPresentation['chips'][number]['tone']) {
  switch (tone) {
    case 'positive':
      return styles.chipPositive;
    case 'mixed':
      return styles.chipMixed;
    case 'warning':
    case 'critical':
      return styles.chipWarning;
    default:
      return styles.chipNeutral;
  }
}

export function CenterRecentImpactSummary({ presentation }: CenterRecentImpactSummaryProps) {
  if (presentation.visibility !== 'visible' || presentation.chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {presentation.title.toUpperCase()}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {presentation.subtitle ?? 'Sonuç etkisi şehir nabzına işlendi'}
          </Text>
        </View>
        <View style={styles.resultBadge}>
          <Ionicons name="sparkles-outline" size={13} color="#0D3F39" />
        </View>
      </View>
      <View style={styles.chipGrid}>
        {presentation.chips.map((chip) => (
          <View key={chip.id} style={[styles.chip, chipToneStyle(chip.tone)]}>
            <Text style={styles.chipValue} numberOfLines={1}>
              {chip.valueText}
            </Text>
            <Text style={styles.chipLabel} numberOfLines={1}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.footerRow}>
        <Ionicons name="checkmark-circle" size={14} color="#3E9E6A" />
        <Text style={styles.footerText} numberOfLines={1}>
          {presentation.footerLine ?? 'Yeni sinyal açıldı'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.26)',
    backgroundColor: '#0D3F39',
    padding: 13,
    gap: 10,
    shadowColor: 'rgba(15, 60, 52, 0.18)',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: '#F5E3AF',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.76)',
  },
  resultBadge: {
    width: 30,
    height: 30,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E3AF',
    flexShrink: 0,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    minWidth: 0,
  },
  chip: {
    width: '48%',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 2,
  },
  chipMixed: {
    backgroundColor: 'rgba(245,227,175,0.28)',
    borderColor: 'rgba(216,167,46,0.30)',
  },
  chipPositive: {
    backgroundColor: 'rgba(157,242,210,0.14)',
    borderColor: 'rgba(7,86,79,0.14)',
  },
  chipWarning: {
    backgroundColor: 'rgba(216,167,46,0.12)',
    borderColor: 'rgba(111,92,42,0.18)',
  },
  chipNeutral: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(245,227,175,0.18)',
  },
  chipValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#173D3A',
    fontVariant: ['tabular-nums'],
  },
  chipLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    color: '#6B7D78',
  },
  footerRow: {
    minHeight: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: '#9DF2D2',
  },
});
