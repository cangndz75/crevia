import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { getReportImpactMetricImage } from '@/core/assets/creviaAssetPresentation';
import type { ReportImpactMetricCardModel } from '@/features/reports/presentation/reportPremiumPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';

type Props = {
  model: ReportImpactMetricCardModel;
};

const TONE_STYLES = {
  mint: {
    bg: '#EEF8F4',
    border: 'rgba(16, 85, 78, 0.1)',
    iconBg: 'rgba(15, 143, 134, 0.14)',
    icon: '#0F8F86',
    valueColor: '#116A63',
    delta: '#3BAF7A',
    wave: 'rgba(15, 143, 134, 0.06)',
  },
  blue: {
    bg: '#EEF5FD',
    border: 'rgba(36, 119, 168, 0.12)',
    iconBg: 'rgba(36, 119, 168, 0.12)',
    icon: '#2477A8',
    valueColor: '#1E5F87',
    delta: '#3BAF7A',
    wave: 'rgba(36, 119, 168, 0.06)',
  },
  gold: {
    bg: '#FBF6EA',
    border: 'rgba(200, 146, 37, 0.16)',
    iconBg: 'rgba(215, 164, 60, 0.18)',
    icon: '#C89225',
    valueColor: '#9A6F12',
    delta: '#C89225',
    wave: 'rgba(215, 164, 60, 0.08)',
  },
  warn: {
    bg: '#FDF4E6',
    border: 'rgba(232, 155, 46, 0.2)',
    iconBg: 'rgba(232, 155, 46, 0.16)',
    icon: '#C47A12',
    valueColor: '#A8640F',
    delta: '#E05A52',
    wave: 'rgba(232, 155, 46, 0.08)',
  },
} as const;

export function ReportImpactMetricCard({ model }: Props) {
  const tone = TONE_STYLES[model.tone];
  const trendColor =
    model.deltaPositive === false
      ? '#E05A52'
      : model.deltaPositive === true
        ? tone.delta
        : tone.valueColor;

  return (
    <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: tone.iconBg }]}>
        <CreviaAssetImage
          source={getReportImpactMetricImage(model.icon)}
          containerStyle={styles.iconAsset}
          contentFit="contain"
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {model.label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: tone.valueColor }]} numberOfLines={1}>
          {model.value}
        </Text>
        {model.deltaPositive != null ? (
          <Ionicons
            name={model.deltaPositive ? 'arrow-up' : 'arrow-down'}
            size={13}
            color={trendColor}
          />
        ) : null}
      </View>
      <Text style={[styles.delta, { color: trendColor }]} numberOfLines={1}>
        {model.deltaLine}
      </Text>
      <View style={[styles.wave, { backgroundColor: tone.wave }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAsset: {
    width: 26,
    height: 26,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5F5C',
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
    maxWidth: '100%',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  delta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  wave: {
    position: 'absolute',
    bottom: -8,
    left: -4,
    right: -4,
    height: 18,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
});
