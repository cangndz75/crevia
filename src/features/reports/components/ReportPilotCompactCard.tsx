import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ReportPilotCompactModel } from '@/features/reports/presentation/reportScreenPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: ReportPilotCompactModel;
};

export function ReportPilotCompactCard({ model }: Props) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.headerBlock}>
        <View style={styles.headerTop}>
          <CreviaAssetImage
            source={creviaAssets.icons.knowledge.operationGuide}
            containerStyle={styles.headerAsset}
            contentFit="contain"
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Pilot Gün Özeti
          </Text>
        </View>
        <Text style={styles.completedLabel} numberOfLines={1}>
          {model.completedDayLabel}
        </Text>
        <View style={styles.chipRow}>
          <View style={styles.chipBlue}>
            <Text style={styles.chipBlueText} numberOfLines={1}>
              {model.themeChip}
            </Text>
          </View>
          <View style={styles.chipOrange}>
            <Text style={styles.chipOrangeText} numberOfLines={1}>
              {model.dayTitleChip}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.trophyCircle}>
          <CreviaAssetImage
            source={creviaAssets.leaderboard.trophyGold}
            containerStyle={styles.trophyAsset}
            contentFit="contain"
          />
        </View>
        <View style={styles.bodyCopy}>
          <Text style={styles.headline} numberOfLines={2}>
            {model.headline}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {model.summary}
          </Text>
        </View>
      </View>

      <View style={styles.goalStrip}>
        <CreviaAssetImage
          source={creviaAssets.icons.goals.targetTeal}
          containerStyle={styles.stripAsset}
          contentFit="contain"
        />
        <Text style={styles.stripText} numberOfLines={1}>
          {model.goalStripText}
        </Text>
      </View>

      <View style={styles.infoStrip}>
        <CreviaAssetImage
          source={creviaAssets.districts.icons.cityPulse}
          containerStyle={styles.stripAsset}
          contentFit="contain"
        />
        <Text style={styles.stripTextMuted} numberOfLines={1}>
          {model.impactStripText}
        </Text>
      </View>

      <View style={styles.nextStrip}>
        <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.primary} />
        <Text style={styles.nextText} numberOfLines={1}>
          {model.nextDayLine}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.14)',
    padding: 14,
    gap: 10,
    minWidth: 0,
  },
  headerBlock: {
    gap: 6,
    minWidth: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerAsset: {
    width: 18,
    height: 18,
  },
  trophyAsset: {
    width: 28,
    height: 28,
  },
  stripAsset: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  completedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBlue: {
    backgroundColor: colors.secondaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipBlueText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  chipOrange: {
    backgroundColor: colors.warningMuted,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipOrangeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warning,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(245,183,49,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bodyCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  headline: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  summary: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  goalStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningMuted,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 0,
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondaryMuted,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 0,
  },
  stripText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 0,
    flexShrink: 1,
  },
  stripTextMuted: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 0,
    flexShrink: 1,
  },
  nextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
    minWidth: 0,
  },
  nextText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    minWidth: 0,
    flexShrink: 1,
  },
});
