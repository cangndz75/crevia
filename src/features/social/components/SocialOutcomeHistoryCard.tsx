import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import type { SocialOutcomeItem } from '../utils/socialUiModel';
import { SocialExploreCard } from './SocialExploreCard';
import {
  SocialBottomSheet,
  SocialSheetListItem,
} from './SocialBottomSheet';

type PreviewProps = {
  outcomes: SocialOutcomeItem[];
  onPress: () => void;
};

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  outcomes: SocialOutcomeItem[];
};

function formatDelta(delta: number): { text: string; positive: boolean } {
  const rounded = Math.round(delta);
  if (rounded > 0) {
    return { text: `+${rounded} Nabız`, positive: true };
  }
  if (rounded < 0) {
    return { text: `${rounded} Nabız`, positive: false };
  }
  return { text: '0 Nabız', positive: false };
}

function OutcomeRow({ item, compact }: { item: SocialOutcomeItem; compact?: boolean }) {
  const delta = formatDelta(item.delta);

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.iconSquare}>
        <Ionicons name={item.icon} size={compact ? 16 : 18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, compact && styles.rowLabelCompact]} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={styles.rowMeta}>
          <View
            style={[
              styles.deltaPill,
              { backgroundColor: delta.positive ? colors.primaryMuted : colors.dangerMuted },
            ]}>
            <Text
              style={[
                styles.deltaText,
                { color: delta.positive ? colors.primary : colors.danger },
              ]}>
              {delta.text}
            </Text>
          </View>
          <Text style={styles.timeText}>{item.timeAgo}</Text>
        </View>
      </View>
      {!compact ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      ) : null}
    </View>
  );
}

export function SocialOutcomeHistoryCard({ outcomes, onPress }: PreviewProps) {
  const items = Array.isArray(outcomes) ? outcomes : [];
  const latest = items[0];
  const count = items.length;

  return (
    <SocialExploreCard
      accent="teal"
      icon="time-outline"
      title="Sonuç Geçmişi"
      subtitle={
        count > 0
          ? `${count} karar kaydı · Detay için dokun`
          : 'Henüz kayıt yok'
      }
      badge={count > 0 ? `${count}` : undefined}
      onPress={onPress}
      entering={FadeInUp.delay(480).duration(400)}
      preview={
        latest ? (
          <View style={styles.previewBox}>
            <OutcomeRow item={latest} compact />
            {items.length > 1 ? (
              <Text style={styles.moreHint}>
                +{items.length - 1} kayıt daha
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyPreview}>İlk aksiyonun burada görünecek</Text>
        )
      }
    />
  );
}

export function SocialOutcomeHistorySheet({
  visible,
  onClose,
  outcomes,
}: SheetProps) {
  const items = Array.isArray(outcomes) ? outcomes : [];

  return (
    <SocialBottomSheet
      visible={visible}
      onClose={onClose}
      accent="teal"
      icon="time-outline"
      title="Sonuç Geçmişi"
      subtitle={
        items.length > 0
          ? `${items.length} sosyal karar ve nabız etkisi`
          : 'Karar geçmişi boş'
      }>
      {items.length === 0 ? (
        <View style={styles.emptySheet}>
          <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Henüz sonuç yok</Text>
          <Text style={styles.emptyBody}>
            Açıklama yap, ekip yönlendir veya sessiz kal — her karar burada listelenir.
          </Text>
        </View>
      ) : (
        items.map((item, index) => (
          <SocialSheetListItem key={item.id} index={index}>
            <View style={styles.sheetCard}>
              <OutcomeRow item={item} />
            </View>
          </SocialSheetListItem>
        ))
      )}
    </SocialBottomSheet>
  );
}

const styles = StyleSheet.create({
  previewBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.6)',
  },
  moreHint: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  emptyPreview: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCompact: {
    gap: 10,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rowLabelCompact: {
    fontSize: 13,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(228,226,221,0.8)',
  },
  emptySheet: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
