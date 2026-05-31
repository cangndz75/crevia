import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { colors } from '@/ui/theme/colors';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  lines?: string[];
  compact?: boolean;
};

export function ReportAuthoritySummary({
  lines = [],
  compact = false,
}: Props) {
  const line1 = lines[0]?.trim() || 'Pilot boyunca izlenir.';
  const line2 = lines[1]?.trim() || 'Gün sonunda güven puanı güncellenir.';
  const bodyText =
    lines.length === 0
      ? 'Pilot boyunca izlenir. Gün sonunda güven puanı güncellenir.'
      : lines.length === 1
        ? line1
        : `${line1} ${line2}`;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.emblem}>
        <CreviaAssetImage
          source={creviaAssets.authority.shieldCheck}
          containerStyle={styles.emblemAsset}
          contentFit="contain"
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          YETKİ GÜVENİ
        </Text>
        <Text style={styles.line} numberOfLines={2}>
          {bodyText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(91,143,212,0.18)',
    padding: 12,
    minWidth: 0,
  },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emblemAsset: {
    width: 30,
    height: 30,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  line: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
